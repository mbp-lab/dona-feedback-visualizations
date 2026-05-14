"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid2";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Filler,
  type Plugin
} from "chart.js";
import { useState, useMemo, type ReactNode } from "react";
import { Line } from "react-chartjs-2";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import { FEEDBACK_SECTION_CHART_RECEIVED, FEEDBACK_SECTION_CHART_SENT } from "@components/charts/feedbackSectionTheme";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

/** Parse HTML date input (YYYY-MM-DD) as local calendar midnight. */
function parsePickerYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Tinted bands + labels for before / after (drawn behind datasets). */
const beforeAfterBandsPlugin: Plugin<"line"> = {
  id: "beforeAfterBands",
  beforeDatasetsDraw(chart) {
    const eventIndex = (chart.options.plugins as { beforeAfterBands?: { eventIndex: number } } | undefined)?.beforeAfterBands?.eventIndex;
    if (eventIndex == null || eventIndex < 1) return;
    const meta = chart.getDatasetMeta(0);
    if (!meta?.data?.length) return;
    const prev = meta.data[eventIndex - 1];
    const curr = meta.data[eventIndex];
    if (!prev || !curr || typeof prev.x !== "number" || typeof curr.x !== "number") return;
    const splitX = (prev.x + curr.x) / 2;
    const { ctx, chartArea } = chart;
    const { top, bottom, left, right } = chartArea;

    ctx.save();
    ctx.fillStyle = alpha(FEEDBACK_SECTION_CHART_SENT, 0.14);
    ctx.fillRect(left, top, splitX - left, bottom - top);
    ctx.fillStyle = alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.14);
    ctx.fillRect(splitX, top, right - splitX, bottom - top);

    ctx.font = '600 11px system-ui, -apple-system, "Segoe UI", sans-serif';
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const labelY = top + 6;
    ctx.fillText("Before", left + (splitX - left) / 2, labelY);
    ctx.fillText("After", splitX + (right - splitX) / 2, labelY);
    ctx.restore();
  }
};

interface MessageData {
  dateTime: Date;
  wordCount: number;
}

function buildDayCounts(msgs: MessageData[]): Map<string, number> {
  const m = new Map<string, number>();
  msgs.forEach(x => {
    const k = toLocalYmd(new Date(x.dateTime));
    m.set(k, (m.get(k) || 0) + 1);
  });
  return m;
}

/** Monday-start week (local) for grouping long timelines. */
function weekStartMonday(d: Date): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = date.getDay();
  const delta = dow === 0 ? -6 : 1 - dow;
  date.setDate(date.getDate() + delta);
  return date;
}

function aggregateDailySeriesToWeekly(allDates: string[], values: number[]): { weekLabels: string[]; weekTotals: number[] } {
  const map = new Map<string, number>();
  for (let i = 0; i < allDates.length; i++) {
    const wk = toLocalYmd(weekStartMonday(parsePickerYmd(allDates[i])));
    map.set(wk, (map.get(wk) || 0) + values[i]);
  }
  const weekLabels = [...map.keys()].sort();
  const weekTotals = weekLabels.map(w => map.get(w)!);
  return { weekLabels, weekTotals };
}

function formatWeekRangeLabel(weekStartYmd: string): string {
  const start = parsePickerYmd(weekStartYmd);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const o = { month: "short" as const, day: "numeric" as const };
  return `${start.toLocaleDateString(undefined, o)} – ${end.toLocaleDateString(undefined, o)}`;
}

/** Use weekly buckets when the span is long enough that daily points look crowded. */
const FULL_PERIOD_WEEKLY_THRESHOLD_DAYS = 56;

interface PerChatMessages {
  chatName: string;
  messages: MessageData[];
}

interface EventComparisonProps {
  sentMessages: MessageData[];
  receivedMessages: MessageData[];
  perChatSentMessages: PerChatMessages[];
  defaultWindowDays?: number;
  /** Hide the "Event-Based Activity Analysis" heading + intro when used inside a combined section */
  hideSectionIntro?: boolean;
  /** If set, full-width sliding-window chart (life-event section); shown before metrics & timeline. */
  chartSlotLeft?: ReactNode;
  /** Optional heading above the sliding-window chart. */
  chartSlotLeftTitle?: string;
}

interface PeriodMetrics {
  totalMessages: number;
  avgMessagesPerDay: number;
  avgWordCount: number;
  totalWords: number;
  mostActiveDay: string;
  messagesPerDay: Map<string, number>;
}

const ALL_CHATS = "__all__";

const EventComparisonChart: React.FC<EventComparisonProps> = ({
  sentMessages,
  receivedMessages,
  perChatSentMessages,
  defaultWindowDays = 30,
  hideSectionIntro = false,
  chartSlotLeft,
  chartSlotLeftTitle
}) => {
  const [eventDate, setEventDate] = useState<string>("");
  const [windowDays, setWindowDays] = useState(defaultWindowDays);
  const [selectedChat, setSelectedChat] = useState<string>(ALL_CHATS);

  const activeSentMessages = useMemo(() => {
    if (selectedChat === ALL_CHATS) return sentMessages;
    const chat = perChatSentMessages.find(c => c.chatName === selectedChat);
    return chat ? chat.messages : [];
  }, [selectedChat, sentMessages, perChatSentMessages]);

  const showReceived = selectedChat === ALL_CHATS;

  const { beforeSent, afterSent, beforeReceived, afterReceived, hasComparisonData } = useMemo(() => {
    if (!eventDate || activeSentMessages.length === 0) {
      return { beforeSent: null, afterSent: null, beforeReceived: null, afterReceived: null, hasComparisonData: false };
    }

    const event = parsePickerYmd(eventDate);
    const beforeStart = new Date(event);
    beforeStart.setDate(beforeStart.getDate() - windowDays);
    const afterEnd = new Date(event);
    afterEnd.setDate(afterEnd.getDate() + windowDays);

    const filterPeriod = (msgs: MessageData[], start: Date, end: Date) =>
      msgs.filter(m => {
        const d = new Date(m.dateTime);
        return d >= start && d < end;
      });

    const calcMetrics = (msgs: MessageData[], periodStart: Date, periodEnd: Date): PeriodMetrics => {
      const totalMessages = msgs.length;
      const totalWords = msgs.reduce((sum, m) => sum + (m.wordCount || 0), 0);
      const avgWordCount = totalMessages > 0 ? totalWords / totalMessages : 0;
      const daysInPeriod = Math.max(1, Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)));
      const avgMessagesPerDay = totalMessages / daysInPeriod;

      const messagesByDay = new Map<string, number>();
      msgs.forEach(m => {
        const date = toLocalYmd(new Date(m.dateTime));
        messagesByDay.set(date, (messagesByDay.get(date) || 0) + 1);
      });

      const mostActiveDay =
        messagesByDay.size > 0 ? [...messagesByDay.entries()].reduce((max, curr) => (curr[1] > max[1] ? curr : max))[0] : "N/A";

      return { totalMessages, avgMessagesPerDay, avgWordCount, totalWords, mostActiveDay, messagesPerDay: messagesByDay };
    };

    const bSent = filterPeriod(activeSentMessages, beforeStart, event);
    const aSent = filterPeriod(activeSentMessages, event, afterEnd);

    const bRecv = showReceived ? filterPeriod(receivedMessages, beforeStart, event) : [];
    const aRecv = showReceived ? filterPeriod(receivedMessages, event, afterEnd) : [];

    return {
      beforeSent: calcMetrics(bSent, beforeStart, event),
      afterSent: calcMetrics(aSent, event, afterEnd),
      beforeReceived: showReceived ? calcMetrics(bRecv, beforeStart, event) : null,
      afterReceived: showReceived ? calcMetrics(aRecv, event, afterEnd) : null,
      hasComparisonData: true
    };
  }, [eventDate, activeSentMessages, receivedMessages, windowDays, showReceived]);

  const timelineChartData = useMemo((): {
    labels: string[];
    datasets: any[];
    mode: "event" | "full";
    range?: { start: string; end: string };
    granularity?: "day" | "week";
  } | null => {
    const sentLabel = selectedChat === ALL_CHATS ? "Sent Messages" : `Sent – ${selectedChat}`;

    const makeSentDataset = (sentCounts: number[], style: "event" | "full") =>
      style === "event"
        ? {
            label: sentLabel,
            data: sentCounts,
            order: 2,
            borderColor: FEEDBACK_SECTION_CHART_SENT,
            backgroundColor: alpha(FEEDBACK_SECTION_CHART_SENT, 0.2),
            tension: 0.4,
            fill: true,
            pointRadius: 2,
            pointHoverRadius: 5,
            borderWidth: 2
          }
        : {
            label: sentLabel,
            data: sentCounts,
            order: 2,
            borderColor: FEEDBACK_SECTION_CHART_SENT,
            backgroundColor: alpha(FEEDBACK_SECTION_CHART_SENT, 0.11),
            tension: 0.35,
            fill: true,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHitRadius: 12,
            borderWidth: 2.5
          };

    const makeRecvDataset = (recvCounts: number[], style: "event" | "full") =>
      style === "event"
        ? {
            label: "Received Messages",
            data: recvCounts,
            order: 1,
            borderColor: FEEDBACK_SECTION_CHART_RECEIVED,
            backgroundColor: alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.2),
            tension: 0.4,
            fill: true,
            pointRadius: 2,
            pointHoverRadius: 5,
            borderWidth: 2
          }
        : {
            label: "Received Messages",
            data: recvCounts,
            order: 1,
            borderColor: FEEDBACK_SECTION_CHART_RECEIVED,
            backgroundColor: "rgba(0,0,0,0)",
            tension: 0.35,
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHitRadius: 12,
            borderWidth: 2,
            borderDash: [6, 4]
          };

    if (eventDate) {
      if (!beforeSent || !afterSent) return null;

      const event = parsePickerYmd(eventDate);
      const beforeStart = new Date(event);
      beforeStart.setDate(beforeStart.getDate() - windowDays);
      const afterEnd = new Date(event);
      afterEnd.setDate(afterEnd.getDate() + windowDays);

      const allDates: string[] = [];
      const d = new Date(beforeStart);
      while (d < afterEnd) {
        allDates.push(toLocalYmd(d));
        d.setDate(d.getDate() + 1);
      }

      const sentByDay = new Map<string, number>();
      [beforeSent, afterSent].forEach(m => m.messagesPerDay.forEach((v, k) => sentByDay.set(k, (sentByDay.get(k) || 0) + v)));

      const sentCounts = allDates.map(date => sentByDay.get(date) || 0);
      const datasets: any[] = [makeSentDataset(sentCounts, "event")];

      if (showReceived && beforeReceived && afterReceived) {
        const recvByDay = new Map<string, number>();
        [beforeReceived, afterReceived].forEach(m => m.messagesPerDay.forEach((v, k) => recvByDay.set(k, (recvByDay.get(k) || 0) + v)));
        const recvCounts = allDates.map(date => recvByDay.get(date) || 0);
        datasets.push(makeRecvDataset(recvCounts, "event"));
      }

      return { labels: allDates, datasets, mode: "event" };
    }

    const sentByDay = buildDayCounts(activeSentMessages);
    const recvByDay = showReceived ? buildDayCounts(receivedMessages) : null;
    const keys = new Set<string>();
    sentByDay.forEach((_, k) => keys.add(k));
    recvByDay?.forEach((_, k) => keys.add(k));
    if (keys.size === 0) return null;

    const sorted = [...keys].sort();
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const allDates: string[] = [];
    const walk = new Date(parsePickerYmd(first));
    const endWalk = parsePickerYmd(last);
    while (walk <= endWalk) {
      allDates.push(toLocalYmd(walk));
      walk.setDate(walk.getDate() + 1);
    }

    const sentCountsDaily = allDates.map(date => sentByDay.get(date) || 0);
    const recvCountsDaily = recvByDay ? allDates.map(date => recvByDay.get(date) || 0) : null;

    let plotLabels = allDates;
    let sentPlot = sentCountsDaily;
    let recvPlot = recvCountsDaily;
    let granularity: "day" | "week" = "day";

    if (allDates.length > FULL_PERIOD_WEEKLY_THRESHOLD_DAYS) {
      const sw = aggregateDailySeriesToWeekly(allDates, sentCountsDaily);
      plotLabels = sw.weekLabels;
      sentPlot = sw.weekTotals;
      if (recvCountsDaily) {
        const rw = aggregateDailySeriesToWeekly(allDates, recvCountsDaily);
        recvPlot = rw.weekTotals;
      }
      granularity = "week";
    }

    const datasets: any[] = [makeSentDataset(sentPlot, "full")];
    if (recvPlot) {
      datasets.push(makeRecvDataset(recvPlot, "full"));
    }

    return { labels: plotLabels, datasets, mode: "full", range: { start: first, end: last }, granularity };
  }, [
    eventDate,
    beforeSent,
    afterSent,
    beforeReceived,
    afterReceived,
    activeSentMessages,
    receivedMessages,
    windowDays,
    selectedChat,
    showReceived
  ]);

  const chartPayload = useMemo(() => {
    if (!timelineChartData) return null;
    return { labels: timelineChartData.labels, datasets: timelineChartData.datasets };
  }, [timelineChartData]);

  const eventLineIndex = useMemo(() => {
    if (!timelineChartData || timelineChartData.mode !== "event" || !eventDate) return -1;
    const i = timelineChartData.labels.findIndex(l => l === eventDate);
    return i >= 0 ? i : -1;
  }, [timelineChartData, eventDate]);

  const chartOptions = useMemo(() => {
    const labels = chartPayload?.labels ?? [];
    const isFullPeriod = timelineChartData?.mode === "full";
    const granularity = timelineChartData?.granularity ?? "day";
    const isWeeklyFull = isFullPeriod && granularity === "week";

    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index" as const, intersect: false },
      elements: {
        line: { borderJoinStyle: "round" as const }
      },
      plugins: {
        legend: {
          display: true,
          position: "top" as const,
          labels: {
            boxWidth: 14,
            boxHeight: 14,
            usePointStyle: true,
            padding: 16,
            font: { size: 12 }
          }
        },
        title: {
          display: true,
          text: isFullPeriod
            ? isWeeklyFull
              ? "Messaging activity (by week)"
              : "Messaging activity (by day)"
            : "Activity Timeline Around Event",
          font: { size: 16, weight: "bold" as const },
          padding: { bottom: 8 }
        },
        tooltip: {
          intersect: false,
          mode: "index" as const,
          callbacks: {
            title(tooltipItems: any[]) {
              if (!tooltipItems.length) return "";
              const idx = tooltipItems[0].dataIndex;
              const iso = labels[idx];
              if (!iso) return "";
              if (isWeeklyFull) {
                return `Week of ${formatWeekRangeLabel(iso)}`;
              }
              return new Date(iso + "T12:00:00").toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric"
              });
            },
            label: function (context: any) {
              return `${context.dataset.label}: ${context.parsed.y}`;
            }
          }
        },
        beforeAfterBands: { eventIndex: eventLineIndex }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: isWeeklyFull ? "Messages (weekly total)" : isFullPeriod ? "Messages (per day)" : "Messages",
            font: { size: 12 }
          },
          grid: { color: "rgba(0, 0, 0, 0.06)" },
          ticks: { font: { size: 11 } }
        },
        x: {
          title: { display: true, text: "Date", font: { size: 12 } },
          grid: { display: false },
          ticks: {
            maxTicksLimit: isWeeklyFull ? 14 : isFullPeriod ? 16 : 14,
            maxRotation: isFullPeriod ? 40 : 45,
            minRotation: 0,
            autoSkip: true,
            callback: (_tickVal: string | number, index: number) => {
              const iso = labels[index];
              if (!iso) return "";
              return new Date(iso + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
            },
            font: (ctx: { tick?: { value?: number } }) => {
              const base = { size: 11 } as const;
              if (isFullPeriod) return base;
              const idx = ctx.tick?.value;
              if (typeof idx === "number" && idx === eventLineIndex) {
                return { ...base, weight: 700 as const };
              }
              return base;
            }
          }
        }
      }
    };
  }, [chartPayload?.labels, eventLineIndex, timelineChartData?.mode, timelineChartData?.granularity]);

  const calculateChange = (before: number, after: number): { value: number; trend: "up" | "down" | "flat" } => {
    if (before === 0) return { value: after > 0 ? 100 : 0, trend: after > 0 ? "up" : "flat" };
    const change = ((after - before) / before) * 100;
    if (Math.abs(change) < 5) return { value: change, trend: "flat" };
    return { value: change, trend: change > 0 ? "up" : "down" };
  };

  const MetricCard = ({ title, before, after, unit = "" }: { title: string; before: number; after: number; unit?: string }) => {
    const change = calculateChange(before, after);
    const TrendIcon = change.trend === "up" ? TrendingUpIcon : change.trend === "down" ? TrendingDownIcon : TrendingFlatIcon;
    const trendColor = change.trend === "up" ? "success.main" : change.trend === "down" ? "error.main" : "text.secondary";

    return (
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 1 }}>
            <Typography variant="h6" sx={{ color: FEEDBACK_SECTION_CHART_SENT }}>
              {before.toFixed(1)}
              {unit}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              →
            </Typography>
            <Typography variant="h6" sx={{ color: FEEDBACK_SECTION_CHART_RECEIVED }}>
              {after.toFixed(1)}
              {unit}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <TrendIcon sx={{ fontSize: 20, color: trendColor }} />
            <Typography variant="body2" sx={{ color: trendColor, fontWeight: 600 }}>
              {change.value >= 0 ? "+" : ""}
              {change.value.toFixed(1)}%
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const controlsGrid = (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField
          fullWidth
          label="Event Date"
          type="date"
          value={eventDate}
          onChange={e => setEventDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          helperText="Optional. Leave empty to show your full timeline."
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField
          fullWidth
          label="Comparison Window (days)"
          type="number"
          value={windowDays}
          onChange={e => setWindowDays(Math.max(7, Math.min(90, parseInt(e.target.value) || 30)))}
          inputProps={{ min: 7, max: 90 }}
          helperText="Used when an event date is set (7–90)"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <FormControl fullWidth>
          <InputLabel>Chat filter (sent only)</InputLabel>
          <Select value={selectedChat} label="Chat filter (sent only)" onChange={e => setSelectedChat(e.target.value)}>
            <MenuItem value={ALL_CHATS}>All chats (sent + received)</MenuItem>
            {perChatSentMessages.map(chat => (
              <MenuItem key={chat.chatName} value={chat.chatName}>
                {chat.chatName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );

  const timelineFooterEl =
    timelineChartData?.mode === "full" && timelineChartData.range ? (
      <Typography variant="body2" color="text.secondary">
        <strong>Full period:</strong> {parsePickerYmd(timelineChartData.range.start).toLocaleDateString()} –{" "}
        {parsePickerYmd(timelineChartData.range.end).toLocaleDateString()}
        &nbsp;|&nbsp;
        {timelineChartData.granularity === "week"
          ? `Weekly (Mon–Sun).${showReceived ? " Dashed = received." : ""}`
          : `Daily.${showReceived ? " Dashed = received." : ""}`}{" "}
        Add event date for before/after.
        {selectedChat !== ALL_CHATS ? (
          <>
            &nbsp;|&nbsp; <strong>Filtered to:</strong> {selectedChat} (sent only)
          </>
        ) : null}
      </Typography>
    ) : eventDate ? (
      <Typography variant="body2" color="text.secondary">
        <strong>Event date:</strong> {parsePickerYmd(eventDate).toLocaleDateString()} &nbsp;|&nbsp;
        <strong>Window:</strong> {windowDays} days before & after
        {selectedChat !== ALL_CHATS ? (
          <>
            &nbsp;|&nbsp; <strong>Filtered to:</strong> {selectedChat} (sent only)
          </>
        ) : null}
      </Typography>
    ) : null;

  return (
    <Box sx={{ width: "100%" }}>
      {chartSlotLeft ? (
        <>
          <Box>{controlsGrid}</Box>
          <Divider sx={{ my: 2.5 }} />
          <Box>
            {chartSlotLeftTitle ? (
              <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 700, color: "text.primary", mb: 2 }}>
                {chartSlotLeftTitle}
              </Typography>
            ) : null}
            {chartSlotLeft}
          </Box>
          {hasComparisonData && beforeSent && afterSent && (
            <>
              <Divider sx={{ my: 2.5 }} />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <MetricCard title="Avg Sent/Day" before={beforeSent.avgMessagesPerDay} after={afterSent.avgMessagesPerDay} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <MetricCard title="Avg Words/Sent Msg" before={beforeSent.avgWordCount} after={afterSent.avgWordCount} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <MetricCard title="Total Sent" before={beforeSent.totalMessages} after={afterSent.totalMessages} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  {showReceived && beforeReceived && afterReceived ? (
                    <MetricCard title="Total Received" before={beforeReceived.totalMessages} after={afterReceived.totalMessages} />
                  ) : (
                    <MetricCard title="Total Words" before={beforeSent.totalWords} after={afterSent.totalWords} />
                  )}
                </Grid>
              </Grid>
            </>
          )}
          <Divider sx={{ my: 2.5 }} />
          {chartPayload ? (
            <Box>
              <Box sx={{ height: { xs: 320, sm: 380 } }}>
                <Line data={chartPayload} options={chartOptions} plugins={[beforeAfterBandsPlugin]} />
              </Box>
              {timelineFooterEl ? <Box sx={{ mt: 2, p: 2, bgcolor: "action.hover", borderRadius: 2 }}>{timelineFooterEl}</Box> : null}
            </Box>
          ) : (
            <Box
              sx={{
                textAlign: "center",
                py: 4,
                px: 2,
                border: "1px dashed",
                borderColor: "divider",
                borderRadius: 2,
                bgcolor: "action.hover"
              }}
            >
              <Typography variant="body2" color="text.secondary">
                No messages in the current selection to chart.
              </Typography>
            </Box>
          )}
        </>
      ) : (
        <>
          <Card
            elevation={0}
            sx={{
              mb: 3,
              bgcolor: hideSectionIntro ? "grey.50" : alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.08),
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2
            }}
          >
            <CardContent>
              {!hideSectionIntro && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: FEEDBACK_SECTION_CHART_SENT }}>
                    Event-Based Activity Analysis
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Optionally pick a date to compare activity before and after; otherwise the chart shows your full message timeline.
                  </Typography>
                </>
              )}
              {controlsGrid}
            </CardContent>
          </Card>
          {hasComparisonData && beforeSent && afterSent ? (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <MetricCard title="Avg Sent/Day" before={beforeSent.avgMessagesPerDay} after={afterSent.avgMessagesPerDay} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <MetricCard title="Avg Words/Sent Msg" before={beforeSent.avgWordCount} after={afterSent.avgWordCount} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <MetricCard title="Total Sent" before={beforeSent.totalMessages} after={afterSent.totalMessages} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                {showReceived && beforeReceived && afterReceived ? (
                  <MetricCard title="Total Received" before={beforeReceived.totalMessages} after={afterReceived.totalMessages} />
                ) : (
                  <MetricCard title="Total Words" before={beforeSent.totalWords} after={afterSent.totalWords} />
                )}
              </Grid>
            </Grid>
          ) : null}
          {chartPayload ? (
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", mb: 3 }}>
              <CardContent>
                <Box sx={{ height: 400 }}>
                  <Line data={chartPayload} options={chartOptions} plugins={[beforeAfterBandsPlugin]} />
                </Box>
                {timelineFooterEl ? <Box sx={{ mt: 2, p: 2, background: "action.hover", borderRadius: 2 }}>{timelineFooterEl}</Box> : null}
              </CardContent>
            </Card>
          ) : (
            <Box sx={{ textAlign: "center", py: 4, mb: 3 }}>
              <Typography variant="body2" color="text.secondary">
                No messages in the current selection to chart.
              </Typography>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default EventComparisonChart;

"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid2";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Title, Tooltip, Filler } from "chart.js";
import { useState, useMemo } from "react";
import { Line } from "react-chartjs-2";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import { CHART_COLORS } from "@components/charts/chartConfig";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface MessageData {
  dateTime: Date;
  wordCount: number;
}

interface PerChatMessages {
  chatName: string;
  messages: MessageData[];
}

interface EventComparisonProps {
  sentMessages: MessageData[];
  receivedMessages: MessageData[];
  perChatSentMessages: PerChatMessages[];
  defaultWindowDays?: number;
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
  defaultWindowDays = 30
}) => {
  const theme = useTheme();
  const [eventDate, setEventDate] = useState<string>("");
  const [windowDays, setWindowDays] = useState(defaultWindowDays);
  const [selectedChat, setSelectedChat] = useState<string>(ALL_CHATS);

  const activeSentMessages = useMemo(() => {
    if (selectedChat === ALL_CHATS) return sentMessages;
    const chat = perChatSentMessages.find(c => c.chatName === selectedChat);
    return chat ? chat.messages : [];
  }, [selectedChat, sentMessages, perChatSentMessages]);

  const showReceived = selectedChat === ALL_CHATS;

  const { beforeSent, afterSent, beforeReceived, afterReceived, hasData } = useMemo(() => {
    if (!eventDate || activeSentMessages.length === 0) {
      return { beforeSent: null, afterSent: null, beforeReceived: null, afterReceived: null, hasData: false };
    }

    const event = new Date(eventDate);
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
        const date = new Date(m.dateTime).toISOString().split("T")[0];
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
      hasData: true
    };
  }, [eventDate, activeSentMessages, receivedMessages, windowDays, showReceived]);

  const chartData = useMemo(() => {
    if (!beforeSent || !afterSent) return null;

    const event = new Date(eventDate);
    const beforeStart = new Date(event);
    beforeStart.setDate(beforeStart.getDate() - windowDays);
    const afterEnd = new Date(event);
    afterEnd.setDate(afterEnd.getDate() + windowDays);

    const allDates: string[] = [];
    const d = new Date(beforeStart);
    while (d <= afterEnd) {
      allDates.push(d.toISOString().split("T")[0]);
      d.setDate(d.getDate() + 1);
    }

    const sentByDay = new Map<string, number>();
    [beforeSent, afterSent].forEach(m => m.messagesPerDay.forEach((v, k) => sentByDay.set(k, (sentByDay.get(k) || 0) + v)));

    const sentCounts = allDates.map(date => sentByDay.get(date) || 0);

    const datasets: any[] = [
      {
        label: selectedChat === ALL_CHATS ? "Sent Messages" : `Sent – ${selectedChat}`,
        data: sentCounts,
        borderColor: CHART_COLORS.primary,
        backgroundColor: CHART_COLORS.primaryTransparent,
        tension: 0.4,
        fill: true,
        pointRadius: 2,
        pointHoverRadius: 5
      }
    ];

    if (showReceived && beforeReceived && afterReceived) {
      const recvByDay = new Map<string, number>();
      [beforeReceived, afterReceived].forEach(m => m.messagesPerDay.forEach((v, k) => recvByDay.set(k, (recvByDay.get(k) || 0) + v)));
      const recvCounts = allDates.map(date => recvByDay.get(date) || 0);

      datasets.push({
        label: "Received Messages",
        data: recvCounts,
        borderColor: CHART_COLORS.secondary,
        backgroundColor: CHART_COLORS.secondaryTransparent,
        tension: 0.4,
        fill: true,
        pointRadius: 2,
        pointHoverRadius: 5
      });
    }

    return { labels: allDates, datasets };
  }, [beforeSent, afterSent, beforeReceived, afterReceived, eventDate, windowDays, theme, selectedChat, showReceived]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: "top" as const },
      title: {
        display: true,
        text: "Activity Timeline Around Event",
        font: { size: 16, weight: "bold" as const }
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `${context.dataset.label}: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: "Messages" } },
      x: {
        title: { display: true, text: "Date" },
        ticks: { maxTicksLimit: 10 }
      }
    }
  };

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
            <Typography variant="h6" sx={{ color: CHART_COLORS.primary }}>
              {before.toFixed(1)}
              {unit}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              →
            </Typography>
            <Typography variant="h6" sx={{ color: CHART_COLORS.secondary }}>
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

  return (
    <Box sx={{ width: "100%" }}>
      <Card
        elevation={0}
        sx={{ mb: 3, background: "linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%)", border: "2px solid", borderColor: "divider" }}
      >
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: "primary.main" }}>
            Event-Based Activity Analysis
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select a significant date to compare your messaging activity before and after that event.
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Event Date"
                type="date"
                value={eventDate}
                onChange={e => setEventDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText="Choose a significant date"
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
                helperText="Days before and after (7-90)"
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
        </CardContent>
      </Card>

      {hasData && beforeSent && afterSent && (
        <>
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

          {chartData && (
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
              <CardContent>
                <Box sx={{ height: 400 }}>
                  <Line data={chartData} options={chartOptions} />
                </Box>
                <Box sx={{ mt: 2, p: 2, background: "action.hover", borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Event date:</strong> {new Date(eventDate).toLocaleDateString()} &nbsp;|&nbsp;
                    <strong>Window:</strong> {windowDays} days before & after
                    {selectedChat !== ALL_CHATS && (
                      <>
                        &nbsp;|&nbsp; <strong>Filtered to:</strong> {selectedChat} (sent only)
                      </>
                    )}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!eventDate && (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            Select an event date above to see the before/after comparison
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default EventComparisonChart;

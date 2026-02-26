import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Button, useTheme } from '@mui/material';
import SwipeableViews from 'react-swipeable-views';
import { GraphData } from '@models/graphData';
import { ceil, floor } from 'lodash';

interface GeneralInfoCarouselProps {
    data: GraphData;
}

export default function GeneralInfoCarousel({ data }: GeneralInfoCarouselProps) {
    const theme = useTheme();
    const [activeStep, setActiveStep] = useState(0);
    const [autoPlay, setAutoPlay] = useState(true);
    const maxSteps = 6;

    const {
        sentMessages,
        sentWords,
        activeDays,
        totalDays,
        activeDaysPercentage,
        wordsPerMessage,
        peakDay
    } = useMemo(() => {
        return {
            sentMessages: data.basicStatistics?.messagesTotal?.allMessages?.sent ?? 0,
            sentWords: data.basicStatistics?.wordsTotal?.sent ?? 0,
            activeDays: data.generalInfoStats?.activityStats?.activeDays ?? 0,
            totalDays: data.generalInfoStats?.activityStats?.totalDays ?? 0,
            activeDaysPercentage: data.generalInfoStats?.activityStats?.activityPercentage ?? 0,
            wordsPerMessage: data.generalInfoStats?.avgWordsPerSentMessage ?? 0,
            peakDay: data.generalInfoStats?.peakDayStats ?? { date: "N/A", activeHours: 0, totalMessagesExchanged: 0, topChat: "N/A" },
        };
    }, [data]);

    const {infoWord} = useMemo(() => {
        let infoWord = "";

        if (sentWords <= 2000) {infoWord = "That is almost the length of a speech like \n“I Have a Dream” by Martin Luther King Jr. (~1,6k words)";}
        else if (sentWords <= 10000) {infoWord = "That is roughly the length of a short story like \n“The Tell-Tale Heart” by Edgar Allan Poe (~2.1k words)";}
        else if (sentWords <= 40000) {infoWord = "That is almost the length of a novella like \n“Animal Farm” by George Orwell (~30k words) \nor Kafka's Metamorphosis (~22k words)";}
        else if (sentWords <= 70000) {infoWord = "That is roughly the length of a short novel like \nThe Great Gatsby (~47k words) or A Clockwork Orange (~60k words)!";}
        else if (sentWords <= 100000) {infoWord = "That is roughly the length of a standard novel like \nHarry Potter and the Philosopher's Stone (~76k words) \nor The Hobbit (~95k words)!";}
        else {infoWord = "That is almost the length of a novel on the scale of \nMoby Dick (~210k words), Anna Karenina (~350k words) \nor Les Misérables (~655k words)";}

        return { infoWord};
    }, [sentMessages, sentWords]);

    const handleNext = () => { setAutoPlay(false); setActiveStep((prev) => (prev + 1) % maxSteps); };
    const handleBack = () => { setAutoPlay(false); setActiveStep((prev) => (prev - 1 + maxSteps) % maxSteps); };
    const handleStepChange = (step: number) => { setAutoPlay(false); setActiveStep(step); };

    const slideBoxStyles = {
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: 400, p: 4, textAlign: 'center',
        background: 'linear-gradient(0deg,rgba(128, 194, 255, 0.75) 0%, rgba(255, 255, 255, 1) 75%)', color: 'navy',
    };

    return (
        <Box sx={{ maxWidth: 850, mx: 'auto', position: 'relative', bgcolor: 'background.paper', borderRadius: 4, boxShadow: 4, overflow: 'hidden' }}>
            <SwipeableViews
                axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'}
                index={activeStep}
                onChangeIndex={handleStepChange}
                enableMouseEvents
            >
                {/* slide 1: header */}
                <Box key="header" sx={slideBoxStyles}>
                    <Typography variant="h3" sx={{ mb: 2, fontWeight: 'bold'}}>
                        GENERAL INFORMATION
                    </Typography>
                </Box>

                {/* slide 2: message count */}
                <Box key="messages" sx={slideBoxStyles}>
                    <Typography variant="body1" paragraph>
                        You sent:
                    </Typography>
                    <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold', mb: 2 }}>
                        {sentMessages.toLocaleString()} messages
                    </Typography>
                    <Typography variant="body1" paragraph>
                        in {data.basicStatistics.numberOfActiveMonths} months!
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 2 }}>
                        Stacking {sentMessages.toLocaleString()} postcards would make a pile about {floor(0.0005 * sentMessages)} meters tall.
                    </Typography>
                </Box>

                {/* slide 3: word count */}
                <Box key="words" sx={slideBoxStyles}>
                    <Typography variant="body1" paragraph>
                        Overall, you sent:
                    </Typography>
                    <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold', mb: 2 }}>
                        {sentWords.toLocaleString()} words
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 2, whiteSpace: 'pre-wrap'}}>
                        {infoWord}
                    </Typography>
                </Box>

                {/* slide 4: words per message */}
                <Box key="words-per-message" sx={slideBoxStyles}>
                    <Typography variant="body1" paragraph>
                        You sent
                    </Typography>
                    <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold', mb: 4 }}>
                        {wordsPerMessage} words per message.
                    </Typography>
                    <Typography variant="body1" paragraph>
                        An average sentence is 15-20 words, so you would send
                    </Typography>
                    <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold', mb: 2 }}>
                        {20/wordsPerMessage} messages
                    </Typography>
                    <Typography variant="body1">
                        to equal one average sentence!
                    </Typography>
                </Box>

                {/* slide 5: activity percentage */}
                <Box key="activity" sx={slideBoxStyles}>
                    <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold'}}>
                        ACTIVITY SUMMARY
                    </Typography>
                    <Typography variant="body1" paragraph>
                        If this was an attendance sheet,
                    </Typography>
                    <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold', mb: 2 }}>
                        {activeDays} out of {totalDays} days
                    </Typography>
                    <Typography variant="body1" paragraph>
                        you&apos;d be marked &quot;Present&quot;!
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 2 }}>
                        Which means you were active {activeDaysPercentage}% of the days, sending at least one message.
                    </Typography>
                </Box>

                {/* --- slide 6: peak day --- */}
                <Box key="peak-day" sx={slideBoxStyles}>
                    <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
                        PEAK DAY
                    </Typography>
                    <Typography variant="body1" paragraph>
                        On your peak texting day, {peakDay.date},
                        in each of the {peakDay.activeHours} hours of the day you were active,
                    </Typography>
                    <Typography variant="body1" paragraph>
                        sending at least one message,
                    </Typography>
                    <Typography variant="body1" paragraph>
                        exchanging {peakDay.totalMessagesExchanged} messages in total.
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 2 }}>
                        And the majority of that happened with {peakDay.topChat}.
                    </Typography>
                </Box>
            </SwipeableViews>

            {/* navigation controls */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2,
                bgcolor: 'background.default'
            }}>
                <Button onClick={handleBack} variant="contained">Back</Button>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {[...Array(maxSteps)].map((_, index) => (
                        <Box
                            key={index}
                            onClick={() => handleStepChange(index)}
                            sx={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                bgcolor: activeStep === index ? 'primary.main' : 'action.disabled',
                                cursor: 'pointer',
                                transition: 'background-color 0.3s'
                            }}
                        />
                    ))}
                </Box>
                <Button onClick={handleNext} variant="contained">Next</Button>
            </Box>
        </Box>
    );
}
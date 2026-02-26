import React, { useState } from 'react';
import { Box, Typography, Button, useTheme } from '@mui/material';
import SwipeableViews from 'react-swipeable-views';
import { GraphData } from '@models/graphData';
import ChartContainer, { ChartType } from '@components/charts/ChartContainer';
import TopContactsPodium from '@components/charts/TopContactsPodium';
import ReplyTimeRace from '@components/charts/ReplyTimeRace';


interface ComparisonCarouselProps {
    data: GraphData;
}

export default function ComparisonCarousel({ data }: ComparisonCarouselProps) {
    const theme = useTheme();
    const [activeStep, setActiveStep] = useState(0);
    const maxSteps = 6;

    const raceData = data.replyTimeRace || [];
    const raceWinnerName = raceData.length > 0 ? raceData[0].name : null;

    const handleNext = () => setActiveStep((prev) => (prev + 1) % maxSteps);
    const handleBack = () => setActiveStep((prev) => (prev - 1 + maxSteps) % maxSteps);
    const handleStepChange = (step: number) => setActiveStep(step);

    const newCarouselHeight = 460;

    const introSlideStyles = {
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: newCarouselHeight, p: 3, textAlign: 'center',
        background: 'linear-gradient(0deg,rgba(128, 194, 255, 0.75) 0%, rgba(255, 255, 255, 1) 75%)', color: 'navy',
    };

    const contentSlideStyles = {
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: newCarouselHeight, p: 3, textAlign: 'center', background: '#FFFFFF', color: '#333',
    };

    const chartSlideStyles = {
        ...contentSlideStyles,
        justifyContent: 'flex-start',
        pt: 2,
    };

    const podiumSlideStyles = {
        ...contentSlideStyles,
        justifyContent: 'center',
    };
    
    const chartWrapperStyles = {
        flexGrow: 1, width: '100%', minHeight: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    };
    
    // this container renders the chart at 125% size, then CSS scales the result down to 80%.
    // proportionally shrinks everything (chart, slider, text) to fit the available space.
    const chartScaleContainerStyles = {
        width: '125%',
        height: '125%',
        transform: 'scale(0.8)',
        transformOrigin: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    };

    const stopPropagationHandlers = {
        onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
        onTouchStart: (e: React.TouchEvent) => e.stopPropagation(),
    };

    return (
        <Box sx={{ maxWidth: 850, mx: 'auto', position: 'relative', bgcolor: 'background.paper', borderRadius: 4, boxShadow: 4, overflow: 'hidden' }}>
            <SwipeableViews axis='x' index={activeStep} onChangeIndex={handleStepChange} enableMouseEvents>
                
                <Box key="intro" sx={introSlideStyles}>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>GRAPHS OF YOUR TEXTING ACTIVITY</Typography>
                </Box>

                <Box key="top-contacts-podium" sx={podiumSlideStyles}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Who are your Top 3 contacts?</Typography>
                    <TopContactsPodium podiumData={data.topContactsPodium} />
                    <Typography sx={{ mt: 2, fontStyle: 'italic' }}>
                        This shows the total messages you sent in these chats.
                    </Typography>
                </Box>

                <Box key="reply-time-race" sx={chartSlideStyles}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>In which chat do you reply the fastest?</Typography>
                    <Typography sx={{ mt: 1 }}>
                        If this was a race, {raceWinnerName} would be the winner!
                    </Typography>
                    <ReplyTimeRace raceData={data.replyTimeRace} />
                </Box>

                <Box key="animated-words" sx={chartSlideStyles}>
                    <Typography sx={{ fontWeight: 'bold', mb: 1, fontSize: 18 }}>Who do you send the most words to?</Typography>
                    <Box sx={chartWrapperStyles} {...stopPropagationHandlers}>
                        <Box sx={chartScaleContainerStyles}>
                            <ChartContainer type={ChartType.AnimatedWordsPerChatBarChart} data={data} />
                        </Box>
                    </Box>
                </Box>

                <Box key="overall-counts" sx={chartSlideStyles}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 2 }}>Do you send more words than you receive?</Typography>
                    <Box sx={chartWrapperStyles} {...stopPropagationHandlers}>
                        <Box sx={chartScaleContainerStyles}>
                            <ChartContainer type={ChartType.WordCountOverallBarChart} data={data} />
                        </Box>
                    </Box>
                </Box>

                <Box key="day-parts" sx={chartSlideStyles}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>When are you the most active?</Typography>
                    <Box sx={chartWrapperStyles} {...stopPropagationHandlers}>
                        <Box sx={{ width: '95%', height: '100%', transform: 'scale(0.8)' }}>
                            <ChartContainer type={ChartType.DayPartsActivityOverallChart} data={data} />
                        </Box>
                    </Box>
                </Box>


            </SwipeableViews>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'background.default' }}>
                <Button onClick={handleBack} variant="contained">Back</Button>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {[...Array(maxSteps)].map((_, index) => (
                        <Box key={index} onClick={() => handleStepChange(index)} sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: activeStep === index ? 'primary.main' : 'action.disabled', cursor: 'pointer' }}/>
                    ))}
                </Box>
                <Button onClick={handleNext} variant="contained">Next</Button>
            </Box>
        </Box>
    );
}
import React, { useState } from 'react';
import { Box, Typography, Button, useTheme, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import SwipeableViews from 'react-swipeable-views';
import { GraphData } from '@models/graphData';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

interface ChatSummaryCarouselProps {
    data: GraphData;
}

export default function ChatSummaryCarousel({ data }: ChatSummaryCarouselProps) {
    const theme = useTheme();
    const [activeStep, setActiveStep] = useState(0);
    const chatSummaries = data.chatSummaries || [];

    const maxSteps = chatSummaries.length + 1; // +1 for the new intro slide

    if (chatSummaries.length === 0) {
        return null; // don't render if there are no chats to summarize
    }

    const handleNext = () => setActiveStep((prev) => (prev + 1) % maxSteps);
    const handleBack = () => setActiveStep((prev) => (prev - 1 + maxSteps) % maxSteps);
    const handleStepChange = (step: number) => setActiveStep(step);

    const slideBoxStyles = {
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: 400, p: 4, textAlign: 'center',
        background: 'linear-gradient(0deg,rgba(128, 194, 255, 0.75) 0%, rgba(255, 255, 255, 1) 75%)', color: 'navy',
    };

    return (
        <Box sx={{ maxWidth: 850, mx: 'auto', position: 'relative', bgcolor: 'background.paper', borderRadius: 4, boxShadow: 4, overflow: 'hidden' }}>
            <SwipeableViews axis='x' index={activeStep} onChangeIndex={handleStepChange} enableMouseEvents>
                
                <Box key="intro" sx={slideBoxStyles}>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                        CHAT SUMMARIES
                    </Typography>
                </Box>

                {chatSummaries.map((summary, index) => (
                    <Box key={index} sx={slideBoxStyles}>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
                            {summary.chatName}
                        </Typography>
                        <List sx={{ width: '100%', maxWidth: 450 }}>
                            <ListItem>
                                <ListItemIcon><CheckCircleOutlineIcon color="primary" /></ListItemIcon>
                                <ListItemText primary={`You sent ${summary.donorSentMessages.toLocaleString()} messages and ${summary.donorSentWords.toLocaleString()} words in this chat.`} />
                            </ListItem>
                            <ListItem>
                                <ListItemIcon><CheckCircleOutlineIcon color="primary" /></ListItemIcon>
                                <ListItemText primary={`${summary.quickReplyPercentage}% of your replies were in less than a minute.`} />
                            </ListItem>
                            <ListItem>
                                <ListItemIcon><CheckCircleOutlineIcon color="primary" /></ListItemIcon>
                                <ListItemText primary={`You had a ${summary.longestStreak} day texting streak.`} />
                            </ListItem>
                        </List>
                    </Box>
                ))}
            </SwipeableViews>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'background.default' }}>
                <Button onClick={handleBack} variant="contained">Back</Button>
                <Box sx={{ display: 'flex', gap: 1 }}>

                    {/* --- dot generation logic --- */}
                    {[...Array(maxSteps)].map((_, index) => (
                        <Box 
                            key={index} 
                            onClick={() => handleStepChange(index)} 
                            sx={{ 
                                width: 10, 
                                height: 10, 
                                borderRadius: '50%', 
                                bgcolor: activeStep === index ? 'primary.main' : 'action.disabled', 
                                cursor: 'pointer' 
                            }}
                        />
                    ))}
                </Box>
                <Button onClick={handleNext} variant="contained">Next</Button>
            </Box>
        </Box>
    );
}
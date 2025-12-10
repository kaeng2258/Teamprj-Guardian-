'use client';

import { createTheme } from '@mantine/core';

export const theme = createTheme({
    /* Put your mantine theme override here */
    primaryColor: 'blue',
    defaultRadius: 'md',
    components: {
        Button: {
            defaultProps: {
                size: 'md',
            },
        },
        TextInput: {
            defaultProps: {
                size: 'md',
            },
        },
    },
});

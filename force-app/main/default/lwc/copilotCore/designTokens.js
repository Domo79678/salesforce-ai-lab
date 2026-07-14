/*
 * designTokens.js
 *
 * Shared design system for Salesforce Copilot.
 *
 * Every workspace imports these tokens instead of
 * hardcoding colors, spacing, typography, card sizes,
 * shadows, badges, or status colors.
 *
 * Version 1.0
 */

export const DESIGN_SYSTEM_VERSION = '1.0';

export const COLORS = Object.freeze({

    brand: '#0176D3',
    brandDark: '#032D60',
    brandLight: '#EAF5FE',

    success: '#2E844A',
    successBackground: '#E8F5EC',

    warning: '#DD7A01',
    warningBackground: '#FFF6E5',

    danger: '#BA0517',
    dangerBackground: '#FDECEC',

    neutral: '#5F6A72',
    neutralBackground: '#F4F6F9',

    border: '#D8DDE6',

    white: '#FFFFFF',

    panelBackground: '#FFFFFF',

    pageBackground: '#F6F8FB',

    textPrimary: '#032D60',

    textSecondary: '#5F6A72',

    textMuted: '#747474'

});

export const SPACING = Object.freeze({

    xxSmall: '0.125rem',

    xSmall: '0.25rem',

    small: '0.5rem',

    medium: '1rem',

    large: '1.5rem',

    xLarge: '2rem',

    xxLarge: '3rem'

});

export const BORDER_RADIUS = Object.freeze({

    small: '0.35rem',

    medium: '0.6rem',

    large: '0.9rem',

    pill: '999px'

});

export const SHADOWS = Object.freeze({

    card:
        '0 2px 8px rgba(0,0,0,.06)',

    hover:
        '0 4px 16px rgba(0,0,0,.10)',

    panel:
        '0 1px 4px rgba(0,0,0,.05)'

});

export const TYPOGRAPHY = Object.freeze({

    hero:

        '2rem',

    title:

        '1.5rem',

    section:

        '1.1rem',

    body:

        '0.85rem',

    caption:

        '0.72rem',

    tiny:

        '0.65rem'

});

export const ICON_SIZES = Object.freeze({

    tiny:

        'xx-small',

    small:

        'x-small',

    medium:

        'small',

    large:

        'medium'

});

export const CARD = Object.freeze({

    padding:

        SPACING.medium,

    borderRadius:

        BORDER_RADIUS.medium,

    shadow:

        SHADOWS.card

});

export const HEADER = Object.freeze({

    height:

        '170px',

    gradient:

        'linear-gradient(90deg,#032D60,#0176D3)',

    textColor:

        '#FFFFFF'

});

export const BADGES = Object.freeze({

    healthy:{

        background:'#E8F5EC',

        color:'#2E844A'

    },

    warning:{

        background:'#FFF6E5',

        color:'#DD7A01'

    },

    danger:{

        background:'#FDECEC',

        color:'#BA0517'

    },

    neutral:{

        background:'#EEF1F6',

        color:'#5F6A72'

    }

});

export const STATUS_COLORS = Object.freeze({

    excellent:'#2E844A',

    healthy:'#2E844A',

    warning:'#DD7A01',

    attention:'#DD7A01',

    risk:'#BA0517',

    critical:'#BA0517',

    ready:'#2E844A',

    notReady:'#BA0517'

});

export const PROGRESS = Object.freeze({

    height:'6px',

    radius:'999px',

    success:'#2E844A',

    warning:'#DD7A01',

    danger:'#BA0517',

    background:'#E5E5E5'

});

export const LAYOUT = Object.freeze({

    maxWidth:'1700px',

    contentPadding:'1rem',

    gutter:'1rem',

    panelGap:'1rem'

});

export const TABLE = Object.freeze({

    rowHeight:'40px',

    headerBackground:'#F4F6F9',

    border:'#D8DDE6'

});

export const ANIMATION = Object.freeze({

    fast:'120ms',

    normal:'200ms',

    slow:'350ms'

});

export const EMPTY_STATE = Object.freeze({

    title:

        'Nothing to display.',

    description:

        'The selected workspace returned no results.'

});

export const LOADING_MESSAGES = Object.freeze({

    snapshot:

        'Loading Salesforce metadata...',

    analysis:

        'Analyzing your Salesforce organization...',

    explorer:

        'Retrieving metadata...',

    refresh:

        'Refreshing workspace...'

});

export function statusColor(status=''){

    const normalized=status.toLowerCase();

    if(normalized.includes('critical')){

        return STATUS_COLORS.critical;

    }

    if(normalized.includes('warning')){

        return STATUS_COLORS.warning;

    }

    if(normalized.includes('ready')){

        return STATUS_COLORS.ready;

    }

    if(normalized.includes('healthy')){

        return STATUS_COLORS.healthy;

    }

    return STATUS_COLORS.warning;

}

export function badgeVariant(status=''){

    const normalized=status.toLowerCase();

    if(normalized.includes('critical')){

        return BADGES.danger;

    }

    if(normalized.includes('warning')){

        return BADGES.warning;

    }

    if(normalized.includes('healthy')){

        return BADGES.healthy;

    }

    return BADGES.neutral;

}
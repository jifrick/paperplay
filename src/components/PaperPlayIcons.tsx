import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const iconProps = (props: IconProps) => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.65,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
  ...props,
});

/** A small house tucked behind a notebook page corner. */
export const NotebookHomeIcon = (props: IconProps) => (
  <svg {...iconProps(props)}>
    <path d="m3.5 10.7 8.5-6.7 8.5 6.7" />
    <path d="M5.5 10.3V20h13v-9.7" />
    <path d="M9.5 20v-5.8h5V20" />
    <path d="m15.5 7.1 2.1-1.7v3.4" />
  </svg>
);

/** An instruction sheet with a folded corner and a checked first step. */
export const InstructionSheetIcon = (props: IconProps) => (
  <svg {...iconProps(props)}>
    <path d="M5 4.5h10.5L19 8v11.5H5z" />
    <path d="M15.5 4.5V8H19" />
    <path d="M8 12h7M8 15h5" />
    <path d="m8.3 8.8 1.1.8 1.4-1.8" />
  </svg>
);

/** An open notebook with a tiny four-point paper spark for playful results. */
export const PlayNotebookIcon = (props: IconProps) => (
  <svg {...iconProps(props)}>
    <path d="M3 7.5c3-1.5 6-1.5 9 0v12c-3-1.5-6-1.5-9 0z" />
    <path d="M21 7.5c-3-1.5-6-1.5-9 0v12c3-1.5 6-1.5 9 0z" />
    <path d="M12 7.5v12" />
    <path d="m17.7 3.2.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5z" />
  </svg>
);

/** A notebook label/tab with a little turned-up paper edge. */
export const PaperTabIcon = (props: IconProps) => (
  <svg {...iconProps(props)}>
    <path d="M4 5h16v12H9l-5 3z" />
    <path d="M8 9h8M8 12h5" />
    <path d="M17 5v3h3" />
  </svg>
);

/** Three offset marks, like pencil notes marching down a page margin. */
export const MarginMarksIcon = (props: IconProps) => (
  <svg {...iconProps(props)}>
    <path d="M5 7h5M14 7h5M5 12h3M12 12h7M5 17h7M16 17h3" />
    <path d="M11 5.5v3M9 10.5v3M14 15.5v3" />
  </svg>
);

/** A privacy sheet used in the More menu. */
export const PrivacySheetIcon = (props: IconProps) => (
  <svg {...iconProps(props)}>
    <path d="M5 4.5h10.5L19 8v11.5H5z" />
    <path d="M15.5 4.5V8H19M8 12h8M8 15h6" />
  </svg>
);

/** A small paper speech tab used for the contact route. */
export const ContactTabIcon = (props: IconProps) => (
  <svg {...iconProps(props)}>
    <path d="M4 6h16v11H9l-5 3z" />
    <path d="M8 10h8M8 13h5" />
  </svg>
);

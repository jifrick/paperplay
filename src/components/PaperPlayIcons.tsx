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

/** PaperPlay's open notebook: curved pages, a folded tab and a paper spark. */
export const PlayNotebookIcon = (props: IconProps) => (
  <svg {...iconProps(props)} viewBox="0 0 32 32">
    <path d="M16 11C12.7 8.7 8.5 8 4.5 9.4v16c4-1.4 8.2-.7 11.5 1.6 3.3-2.3 7.5-3 11.5-1.6v-16c-1.2-.4-2.4-.6-3.6-.7" fill="currentColor" fillOpacity=".1" />
    <path d="M16 11v16M16 11c1.3-.9 2.6-1.5 4-1.9" />
    <path d="M7.8 14c1.7-.2 3.3.1 4.8.8M7.8 17.8c1.7-.2 3.3.1 4.8.8M19.4 18.6c1.5-.7 3.1-1 4.8-.8" opacity=".7" />
    <path d="M20 10.8v4.1l1.7-1 1.7.4V11" />
    <path d="m23 3 .8 2.6 2.7.9-2.7.9L23 10l-.8-2.6-2.7-.9 2.7-.9Z" fill="currentColor" strokeWidth="1" />
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

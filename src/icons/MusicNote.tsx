function MusicNote(props: any) {
  return (
    <svg
      stroke="currentColor"
      fill="currentColor"
      strokeWidth={0}
      viewBox="0 0 48 48"
      className="mr-2"
      height="1em"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g fill="#E91E63" stroke="none">
        <circle cx={19} cy={33} r={9} />
        <path d="M24 6L24 33 28 33 28 14 39 17 39 10z" />
      </g>
    </svg>
  );
}

export default MusicNote;

import { Icons } from "src/types";

const Plus: React.FC<Icons> = ({ color = "#fff" }) => {
  return (
    <div>
      <svg
        width={32}
        height={32}
        viewBox="0 0 48 48"
        fill={color}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M24 8C25.1046 8 26 8.89543 26 10V22H38C39.1046 22 40 22.8954 40 24C40 25.1046 39.1046 26 38 26H26V38C26 39.1046 25.1046 40 24 40C22.8954 40 22 39.1046 22 38V26H10C8.89543 26 8 25.1046 8 24C8 22.8954 8.89543 22 10 22H22V10C22 8.89543 22.8954 8 24 8Z"
        />
      </svg>
    </div>
  );
};

export default Plus;

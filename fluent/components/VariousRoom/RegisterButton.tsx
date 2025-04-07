import React from "react";

interface RegisterButtonProps {
  room: string;
  time: number | "";
  registerStatus: string;
  onClick: () => void;
}

const RegisterButton: React.FC<RegisterButtonProps> = ({
  room,
  time,
  registerStatus,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={!room || time === ""}
      className={`w-full py-2 rounded text-white text-center font-medium mt-4 ${
        room && time !== ""
          ? "bg-green-500 hover:bg-green-600"
          : "bg-gray-300 cursor-not-allowed"
      } transition-colors`}
    >
      {registerStatus}
    </button>
  );
};

export default RegisterButton;

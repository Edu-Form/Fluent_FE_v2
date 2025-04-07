import React from "react";
import { Search } from "lucide-react";

interface StudentSelectProps {
  studentName: string;
  setStudentName: (name: string) => void;
  studentList: string[];
  isDropdownOpen: boolean;
  setIsDropdownOpen: (isOpen: boolean) => void;
}

const StudentSelect: React.FC<StudentSelectProps> = ({
  studentName,
  setStudentName,
  studentList,
  isDropdownOpen,
  setIsDropdownOpen,
}) => {
  const handleStudentSelect = (name: string) => {
    setStudentName(name);
    setIsDropdownOpen(false);
  };

  return (
    <div className="mb-8">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        학생 선택
      </label>
      <div className="relative">
        <div
          className="border border-gray-300 rounded-lg p-4 flex justify-between items-center cursor-pointer hover:border-blue-400 transition-colors"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <div className="flex items-center justify-between w-full">
            <span
              className={`text-lg ${
                studentName ? "text-gray-900" : "text-gray-500"
              }`}
            >
              {studentName || "학생을 선택하세요"}
            </span>
            <div className="flex items-center">
              {studentName && (
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // 이벤트 버블링 방지
                    setStudentName("");
                  }}
                  className="mr-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  ✕
                </button>
              )}
              <svg
                width="12"
                height="6"
                viewBox="0 0 12 6"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`transition-transform ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              >
                <path
                  d="M1 1L6 5L11 1"
                  stroke="#888"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
        {isDropdownOpen && (
          <div className="absolute z-10 w-full mt-1 border border-gray-200 rounded-lg shadow-lg bg-white max-h-64 overflow-y-auto">
            <div className="flex items-center px-4 border-b bg-slate-100">
              <Search />
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full px-4 py-3 bg-slate-100 focus:outline-none"
                placeholder="학생 이름 검색..."
              />
            </div>
            {studentList.length > 0 ? (
              studentList
                .filter((name) =>
                  name.toLowerCase().includes(studentName.toLowerCase())
                )
                .map((name) => (
                  <div
                    key={name}
                    onClick={() => handleStudentSelect(name)}
                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    {name}
                  </div>
                ))
            ) : (
              <div className="px-4 py-3 text-gray-500">학생이 없습니다</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentSelect;

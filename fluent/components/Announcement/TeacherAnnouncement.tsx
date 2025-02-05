import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CiLocationOn } from "react-icons/ci";
import { PiBookBookmarkFill } from "react-icons/pi";
import { TbCardsFilled } from "react-icons/tb";
import { FaCheck } from "react-icons/fa6";
import { Suspense } from "react";

interface ScheduleData {
  room_name: string;
  student_name: string;
  time: string;
  time_range: string;
}

function convertTo12HourFormat(time24: string) {
  const time = parseInt(time24, 10);
  const suffix = time >= 12 ? "PM" : "AM";
  const hours12 = time % 12 || 12; // Convert 0 to 12 for midnight
  return `${hours12} ${suffix}`;
}

const today_formatted = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}. ${month}. ${day}.`;
};

const AnnouncementPage = () => {
  const searchParams = useSearchParams();
  const user = searchParams.get("user");
  const type = searchParams.get("type");
  const user_id = searchParams.get("id");
  const today = today_formatted();

  const [day_schedule_data, setDay_schedule_data] = useState<ScheduleData[]>(
    []
  );
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Fetch schedule data
    const fetchData = async () => {
      const URL = `/api/schedules/oneday_oneteacher/${today}/${user}`;
      try {
        const res = await fetch(URL, { cache: "no-store" });
        const data = await res.json();
        console.log(data);
        setDay_schedule_data(data); // Set all schedule data
      } catch {
        console.log("Error fetching schedule data");
      }
    };
    fetchData();
  }, [user, today]);

  // 필터링된 데이터
  const filteredData = day_schedule_data.filter((schedule) =>
    schedule.student_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full z-50 font-bold">
      <div className="flex text-2xl text-gray-700 mb-10 gap-8 items-center">
        <span className="font-semibold text-black">
          Today {filteredData.length} class{filteredData.length > 1 ? "es" : ""}
        </span>

        {/* Search Box */}
        <input
          type="text"
          placeholder="Search student"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="rounded-xl bg-gray-100 px-4 py-2 text-xs w-[15rem] focus:outline-none focus:ring-2 focus:ring-gray-400"
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        {filteredData.length > 0 ? (
          filteredData.map((schedule, index) => (
            <div key={index} className="relative bg-[#CBE5FF] rounded-xl p-4">
              <div className="absolute left-0 top-0 h-full w-2 bg-[#2675F8] rounded-l-xl"></div>
              <div className="flex flex-col w-full max-w-[600px] mx-auto">
                <div className="flex justify-between items-center">
                  {/* 동그라미와 체크 아이콘 */}
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                      <FaCheck className="text-[#2675F8] text-lg" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-bold font-extrabold text-[#32335c]">
                        {schedule.student_name || "Unknown"}
                      </span>
                      <div className="flex items-center text-xs text-[#C2C2C2] gap-1 mt-1">
                        <CiLocationOn className="text-[#797979] text-lg font-bold" />
                        {schedule.room_name || "Unknown"}
                      </div>
                    </div>
                  </div>

                  {/* 시간 표시 */}
                  <div className="flex items-center justify-center text-xs text-[#2675F8] bg-white border-2 rounded-full border-blue-500 px-2 py-1">
                    {convertTo12HourFormat(schedule.time)}
                  </div>
                </div>
              </div>

              <div className=" mt-4 flex gap-2 justify-end">
                <Link
                  href={`/teacher/student/quizlet?user=${user}&type=${type}&id=${user_id}&student_name=${schedule.student_name}`}
                >
                  <span className="flex items-center justify-center gap-1 border-[#2675F8] border-[1px] bg-white hover:bg-[#2675F8] hover:text-white rounded-lg px-2 py-1 text-[#2675F8] text-xs font-medium shadow-md transition duration-200">
                    <TbCardsFilled className="text-base" />
                    Quizlet
                  </span>
                </Link>

                <Link
                  href={`/teacher/student/diary?user=${user}&type=${type}&id=${user_id}&student_name=${schedule.student_name}`}
                >
                  <span className="flex items-center justify-center gap-1 border-[#FDB568] border-[1px] bg-white hover:bg-[#FDB568] hover:text-white rounded-lg px-2 py-1 text-[#FDB568] text-xs font-medium shadow-md transition duration-200">
                    <PiBookBookmarkFill className="text-base" />
                    Diary
                  </span>
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="flex justify-center items-center h-[200px] ">
            <p className="text-lg font-bold text-gray-500">No class today</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function Announcement() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AnnouncementPage />
    </Suspense>
  );
}

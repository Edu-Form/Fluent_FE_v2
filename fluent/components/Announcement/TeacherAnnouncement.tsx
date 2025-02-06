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
    const fetchData = async () => {
      const URL = `/api/schedules/oneday_oneteacher/${today}/${user}`;
      try {
        const res = await fetch(URL, { cache: "no-store" });
        const data = await res.json();
        setDay_schedule_data(data);
      } catch {
        console.log("Error fetching schedule data");
      }
    };
    fetchData();
  }, [user, today]);

  const filteredData = day_schedule_data.filter((schedule) =>
    schedule.student_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Today {filteredData.length} class
            {filteredData.length > 1 ? "es" : ""}
          </h1>
          <p className="text-sm text-gray-500">{today}</p>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search student"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[280px] px-4 py-2 text-sm bg-gray-50 rounded-xl border-0
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="grid grid-cols-4 gap-4">
        {filteredData.length > 0 ? (
          filteredData.map((schedule, index) => (
            <div
              key={index}
              className="group bg-white rounded-xl border border-gray-100 hover:border-blue-100 shadow-sm hover:shadow-md transition-all"
            >
              <div className="relative p-4">
                <div className="absolute left-0 top-0 h-full w-1 bg-blue-500 rounded-l-xl"></div>

                {/* Student Info */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <FaCheck className="text-blue-500 text-lg" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {schedule.student_name || "Unknown"}
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mt-0.5">
                        <CiLocationOn className="mr-1" />
                        {schedule.room_name || "Unknown"}
                      </div>
                    </div>
                  </div>
                  <div className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-full">
                    {convertTo12HourFormat(schedule.time)}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Link
                    href={`/teacher/student/quizlet?user=${user}&type=${type}&id=${user_id}&student_name=${schedule.student_name}`}
                    className="flex-1"
                  >
                    <span className="flex items-center justify-center gap-1.5 py-2 rounded-lg border border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-colors">
                      <TbCardsFilled className="text-blue-500" />
                      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                        Quizlet
                      </span>
                    </span>
                  </Link>
                  <Link
                    href={`/teacher/student/diary?user=${user}&type=${type}&id=${user_id}&student_name=${schedule.student_name}`}
                    className="flex-1"
                  >
                    <span className="flex items-center justify-center gap-1.5 py-2 rounded-lg border border-gray-100 hover:border-orange-500 hover:bg-orange-50 transition-colors">
                      <PiBookBookmarkFill className="text-orange-500" />
                      <span className="text-sm font-medium text-gray-700 group-hover:text-orange-600">
                        Diary
                      </span>
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-4 flex justify-center items-center h-[200px] bg-white rounded-xl border border-gray-100">
            <p className="text-lg font-medium text-gray-500">No class today</p>
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

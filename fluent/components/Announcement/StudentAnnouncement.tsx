import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import EnterBtn from "../EnterBtn/EnterBtn";
import Button from "../Button/Button";

interface ScheduleData {
  date: string;
  duration: number;
  room_name: string;
  student_name: string;
  teacher_name: string;
  time: number;
}

interface RoomData {
  room_name: string;
  description: string;
}

function next_schedule(data: any) {
  const today = new Date();

  // Format today's date to match the input data format
  const formattedToday = today.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  console.log(formattedToday);

  // Iterate over the sorted data to find the first valid schedule
  for (const item of data) {
    if (item.date >= formattedToday) {
      // String comparison
      console.log("Next class:", item);
      return item; // Return the first valid schedule
    }
  }

  // If no valid schedule is found
  console.log("No upcoming classes found.");
  return null;
}

function room_description(data: any, next_schedule_data: any) {
  for (const item of data) {
    console.log(item);
    console.log(next_schedule_data.room_name);
    if (item.room_name == next_schedule_data.room_name) {
      // String comparison
      console.log("Room Description", item);
      return item; // Return room description
    }
  }
}

function convertTo12HourFormat(time24: any) {
  console.log(time24);
  const suffix = time24 >= 12 ? "PM" : "AM";
  const hours12 = time24 % 12 || 12; // Convert 0 to 12 for midnight
  return `${hours12} ${suffix}`;
}

const AnnouncementPage = () => {
  const searchParams = useSearchParams();
  const user = searchParams.get("user");
  const type = searchParams.get("type");
  const user_id = searchParams.get("id");
  const [next_schedule_data, setNext_schedule_data] =
    useState<ScheduleData | null>(null);
  const [room_data, setRoom_data] = useState<RoomData | null>(null);
  const [next_schedule_data_url, setNext_schedule_data_url] = useState(
    `/diary?user=${user}&type=${type}&id=${user_id}`
  );

  useEffect(() => {
    // 비동기 데이터 로딩 함수
    const fetchData = async () => {
      const URL = `http://13.54.77.128/api/schedules/${type}/${user}`;
      try {
        const res = await fetch(URL, { cache: "no-store" });
        const data = await res.json();
        console.log(data);
        const next = await next_schedule(data);
        setNext_schedule_data(next); // 가져온 데이터를 상태에 설정
        fetchRoomData(next);
      } catch (error) {
        console.log("Error");
      }
    };

    const fetchRoomData = async (next_schedule_data: any) => {
      const URL = `http://13.54.77.128/api/room_list/`;
      try {
        const res = await fetch(URL);
        const data = await res.json();
        console.log(data);
        setRoom_data(room_description(data, next_schedule_data)); // 가져온 데이터를 상태에 설정
      } catch (error) {
        console.log("Error");
      }
    };
    fetchData(); // 데이터 요청 함수 호출
  }, [user, type]); // 컴포넌트가 처음 렌더링될 때만 실행

  useEffect(() => {
    if (next_schedule_data != null)
      setNext_schedule_data_url(
        `/diary?user=${user}&type=${type}&id=${user_id}&today_date=${next_schedule_data.date}`
      );
  }, [next_schedule_data, type, user, user_id]);

  return (
    <div className="flex flex-col z-50 font-bold">
      <span className={`my-5 text-xl text-white font-['Playwrite']`}>
        Fluent
      </span>
      <h1 className="text-2xl mt-9 mb-4 text-white">Hi, {user} !</h1>

      <div className="border-[2px] bg-white border-[#32335c] rounded-2xl w-[30rem] p-6">
        <div className="flex justify-around">
          <div className="flex">
            <div className=" flex flex-col text-lg text-[32335c#0FA7FF] ">
              {next_schedule_data
                ? next_schedule_data.date
                : "No upcoming classes"}
              <span className="flex justify-center text-sm  font-normal text-[#C2C2C2]">
                Next class
              </span>{" "}
            </div>
          </div>

          <div className="flex">
            <div className="flex flex-col text-lg text-[#32335c] ">
              {next_schedule_data
                ? convertTo12HourFormat(next_schedule_data.time)
                : "N/A"}
              <span className="flex justify-center text-sm font-normal text-[#C2C2C2]">
                Time
              </span>{" "}
            </div>
          </div>

          <div className="flex">
            <div className="flex flex-col text-lg text-[#32335c] ">
              {next_schedule_data && room_data
                ? `${next_schedule_data.room_name} - ${room_data.description}`
                : "N/A"}
              <span className="flex justify-center text-sm  font-normal text-[#C2C2C2]">
                Where
              </span>{" "}
            </div>
          </div>
        </div>
      </div>
      <Link
        className="flex mt-4  text-sm justify-end text-white hover:text-[#676ac2]"
        href={`/schedule?user=${user}&type=${type}&id=${user_id}`}
      >
        For more details
        <Image
          src={"/images/arrow.svg"}
          alt=""
          width={14}
          height={14}
          className="ml-1 text-center items-center"
        />
      </Link>

      <div className="mt-10">
        <p className="text-lg mb-4 text-white">
          Did you check everything for your class?
        </p>

        <div className="flex flex-col justify-start gap-4">
          <Link href={`/quizlet?user=${user}&type=${type}&id=${user_id}`}>
            <span className="flex justify-between bg-white  hover:text-white  hover:bg-[#c79868]  rounded-xl p-5 text-[#32335c]">
              Study the Quizlet{" "}
              <Image
                src={"/images/arrow.svg"}
                alt=""
                width={30}
                height={30}
                className="ml-1 text-center items-center"
              />
            </span>
          </Link>
          <Link href={next_schedule_data_url}>
            <span className="flex justify-between bg-white hover:text-white  hover:bg-[#c79868]  rounded-xl p-5 text-[#32335c]">
              Write the Diary
              <Image
                src={"/images/arrow.svg"}
                alt=""
                width={30}
                height={30}
                className="ml-1 text-center items-center"
              />
            </span>
          </Link>
        </div>
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

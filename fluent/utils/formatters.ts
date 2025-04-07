//스케줄 모달 유틸

// 날짜 포맷 함수 - 화면 표시용
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

// 시간 포맷 함수
export const formatTime = (timeValue: number | ""): string => {
  return timeValue === "" ? "" : `${String(timeValue).padStart(2, "0")}:00`;
};

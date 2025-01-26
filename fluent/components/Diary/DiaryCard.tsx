import { motion } from "framer-motion";

export default function DiaryCard({ diarydata }: { diarydata: any }) {
  const letterVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 25,
      },
    },
  };

  const typingVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.009, // 각 글자들이 0.05초 간격으로 나타남
        delayChildren: 0.3, // 텍스트가 다 보여지기 전에 딜레이
      },
    },
  };

  // 타자기 효과를 위한 글자 나누기
  const splitText = (text: string) => {
    return text.split("").map((char, index) => (
      <motion.span key={index} variants={letterVariants}>
        {char}
      </motion.span>
    ));
  };

  // 애니메이션 variants 정의
  const variants = {
    hidden: (isOdd: number) => ({
      opacity: 0,
      y: isOdd ? 50 : 50, // 홀수 인덱스는 50 오른쪽에서, 짝수 인덱스는 -50 왼쪽에서 시작 24년 12월 12일 잠시 -50 : -50으로 수정
    }),
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        ease: "easeInOut",
      },
    },
  };

  return (
    <div>
      {diarydata.map((diary: any, index: number) => {
        const date = new Date(diary.date);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const weekday = date.toLocaleDateString("en-US", { weekday: "long" });

        return (
          <motion.div
            key={index}
            className={`justify-start z-30 my-3 flex ${
              index % 2 !== 0 ? "" : ""
            }`}
            custom={index % 2 !== 0}
            initial="hidden"
            whileInView="visible"
            exit="hidden"
            viewport={{ once: false, amount: 0.4 }} // 뷰포트의 40%만 보여도 애니메이션 작동
            variants={variants}
          >
            <div className="relative">
              <div
                className={`absolute top-[-2rem] ${
                  index % 2 === 0 ? "left-[-1.5rem]" : "left-[-1.5rem]"
                } flex flex-col justify-start m-6 font-[bw] text-[#3f4166]`}
              >
                <div className="flex flex-col font-bold justify-center text-center text-white bg-[#3f4166] rounded-xl w-72 h-12 border-[#3f4166] border-[0.2rem]">
                  <h1 className="flex text-xl font-bold justify-center">
                    {year}년 {month}월 {day}일 {weekday}
                  </h1>
                </div>
              </div>

              <div className="flex flex-col min-w-[15rem]  justify-end my-12 p-5 text-[#3f4166] bg-gray-200 rounded-xl">
                <h1 className="text-lg whitespace-pre-wrap">
                  <div className="grid grid-cols-2 gap-4 ">
                    <div className="border-2 rounded-xl p-6 min-h-[20rem] bg-white">
                      <span className="flex text-xl font-bold justify-start">
                        Original Diary:
                      </span>
                      <span> {diary.original_text}</span>
                    </div>

                    <div className="border-2 rounded-xl p-6 min-h-[20rem]  bg-white">
                      <span className="flex text-xl font-bold justify-start bg-gradient-to-r from-[#c8f7ff] via-[#e600ff] to-[#e600ff] text-transparent bg-clip-text">
                        Corrected Diary:
                      </span>
                      <motion.h1 variants={typingVariants}>
                        <span> {splitText(diary.diary_correction)} </span>
                      </motion.h1>
                    </div>
                  </div>
                  <br />

                  <span className="flex text-xl font-bold justify-start text-[#3f4166] mb-2">
                    Summary
                  </span>
                  <motion.div
                    variants={typingVariants}
                    className="border-2 rounded-xl p-6  bg-white"
                  >
                    {splitText(diary.diary_summary)}
                  </motion.div>

                  <br />
                  <span className="flex text-xl font-bold justify-start text-[#3f4166] mb-2">
                    Expressions
                  </span>
                  <motion.div
                    variants={typingVariants}
                    className="border-2 rounded-xl p-6  bg-white"
                  >
                    {splitText(diary.diary_expressions)}
                  </motion.div>
                </h1>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// app/teacher/student/curriculum/grammar_questions/page.tsx

"use client";

import React from "react";

export default function GrammarQuestionsPage() {
  return (
    <div className="p-6 space-y-8 bg-white max-h-[95vh] overflow-auto">
      <h1 className="text-2xl font-bold mb-4">📘 Grammar Questions (번역시험)</h1>

      {/* 시간 & 날짜 */}
      <section>
        <h2 className="text-xl font-semibold mb-2">1️⃣ 시간 & 날짜</h2>
        <ul className="list-decimal list-inside space-y-1">
          <li>오늘 몇일인가요? 2월 12일 입니다.</li>
          <li>생일이 언제인가요? 5월 31일 입니다.</li>
          <li>7월 20일 / 11월 30일 / 2월 12일 / 4월 15일</li>
          <li>무슨 요일인가요? → 오늘은 수요일이에요</li>
          <li>지금 몇시인지 아시나요? → 지금 12시 반이에요</li>
          <li>학원 오는데 얼마나 걸리나요? → 한 30분 정도 걸려요</li>
          <li>미국 언제 갈꺼야? 8월 7일쯤 갈거야.</li>
          <li>아침 먹고 나서 2가지</li>
          <li>퇴근 하고 나서 2가지</li>
          <li>출근 하고 나서 2가지</li>
        </ul>
      </section>

      {/* 과거형 / be 동사 / 일반동사 / 질문 */}
      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">2️⃣ 과거형 / be 동사 / 일반동사 / 질문 (ask at least 6)</h2>
        <ul className="list-decimal list-inside space-y-1">
          <li>그녀는 행복하지 않았어.</li>
          <li>얼마나 오래 영어를 가르쳤니?</li>
          <li>어떤 영화 봤어?</li>
          <li>그녀는 어떤 음식 좋아한데?</li>
          <li>얼마나 자주 운동하니?</li>
          <li>어떤 영화를 좋아하니?</li>
          <li>어떤 게임을 했어?</li>
          <li>프랑스 어디에서 살았어?</li>
          <li>잘 잤어?</li>
          <li>너의 가족은 어디에 살아?</li>
          <li>아버님은 어떤 회사에서 일하셔?</li>
          <li>가족과 같이 사니?</li>
          <li>그녀는 학교에 가?</li>
          <li>가족과 친하니?</li>
          <li>그녀는 영어를 공부해?</li>
          <li>그는 피자를 좋아해</li>
          <li>그는 무슨 공부를 하니?</li>
          <li>그녀는 매일 독서해</li>
          <li>내 휴가는 11월 13일부터 12월 6일까지야.</li>
          <li>나는 7월 7일에 출장이 있어.</li>
          <li>8월에 계획이 있어?</li>
          <li>일요일에 언제 집에 왔어?</li>
          <li>지난 주말에 어디 갔어?</li>
        </ul>
      </section>

      {/* 미래형 */}
      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">3️⃣ 미래형 (ask at least 3)</h2>
        <ul className="list-decimal list-inside space-y-1">
          <li>내일 뭐할거니? (will & be going to V)</li>
          <li>너 주말에 뭐할거야? (2가지 방법)</li>
          <li>토요일에 나 친구 만나러 강남갈거야</li>
          <li>우리 아마 저녁 먹고 수다 떨기 위해 카페갈거야</li>
          <li>나 내일 미국으로 여행갈거야</li>
          <li>나 오늘 수업 끝나고 집 가서 넷플릭스 볼거야</li>
          <li>너는? 너는 오늘 수업 끝나고 뭐할거니?</li>
        </ul>
      </section>

      {/* to 부정사 */}
      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">4️⃣ to 부정사 (ask at least 3)</h2>
        <ul className="list-decimal list-inside space-y-1">
          <li>너 햄버거 먹고 싶니?</li>
          <li>나는 미래에 경찰이 되기로 결정했어</li>
          <li>나는 요즘 일찍 일어나려고 노력중이야</li>
          <li>내 남동생이 울기 시작했어</li>
          <li>너는 운동하는거 좋아하니?</li>
          <li>퇴근하고 술 먹고 싶어</li>
          <li>그녀는 집에 가서 그녀의 애들을 위해 요리해줘야해</li>
          <li>그는 카페에 가기 위해 압구정에 가야해</li>
          <li>저녁을 아내와 같이 먹고 싶었어.</li>
          <li>아내는 늦게까지 일해야 했어.</li>
          <li>다음 날 6시에 일어나야 해서 일찍 잤어.</li>
          <li>저는 넷플릭스 보면서 치킨 먹는 것을 좋아해</li>
        </ul>
      </section>

      {/* 위해의 2가지 to V / for N */}
      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">5️⃣ 위해의 2가지 to V / for N (ask at least 3)</h2>
        <ul className="list-decimal list-inside space-y-1">
          <li>나는 친구를 만나기 위해 홍대에 갔어</li>
          <li>나는 부모님을 뵙기 위해 일본에 갔어</li>
          <li>나갈 준비를 했어 / 출근 준비를 했어</li>
          <li>친구들을 만나러 홍대에 갔어</li>
          <li>수업을 위해 홍대에 왔어</li>
          <li>나 너를 위해 선물 샀어</li>
        </ul>
      </section>

      {/* 동안 */}
      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">6️⃣ 동안 (ask at least 3)</h2>
        <ul className="list-decimal list-inside space-y-1">
          <li>나는 아침을 먹는 동안 티비를 봤어</li>
          <li>나는 휴가 동안 집에 있었어</li>
          <li>3시간 동안 울었어</li>
          <li>일 년 동안 영어 공부했어</li>
          <li>방학 동안 나는 미국에 갔어</li>
          <li>집에 있는 동안 유투브를 봤어</li>
        </ul>
      </section>

      {/* ing */}
      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">7️⃣ -ing 표현 (ask at least 5)</h2>
        <ul className="list-decimal list-inside space-y-1">
          <li>운동하는 것은 재미있어</li>
          <li>요즘 저는 미국을 가기 위해 영어 공부를 하고 있어요</li>
          <li>나는 피곤했지만 계속 일했어</li>
          <li>나는 취했지만 계속 술을 마셨어</li>
          <li>술은 몸에 안 좋아</li>
          <li>나는 공부하는 것을 좋아해</li>
          <li>나는 피곤했지만 계속 퀴즐렛을 공부했어</li>
          <li>운동은 건강에 좋아</li>
          <li>나는 요즘 여행하는 중이야</li>
          <li>여행하는 것은 내 꿈이야</li>
          <li>나는 어제 축구하는 동안 넘어졌어</li>
          <li>그것은 피곤했어</li>
          <li>TV 보는 것은 재미있어</li>
          <li>나 뛸 거야</li>
          <li>나 골프 잘쳐</li>
          <li>나 요리 못해</li>
          <li>난 기다리고 있어 그녀가 나한테 연락하길</li>
          <li>그는 졸려지기 시작했어</li>
          <li>나 취할 예정이야</li>
          <li>나 라면 먹으러 갈려고 했는데, 시간이 부족했어</li>
        </ul>
      </section>

        {/* 8️⃣ 공감 표현 */}
        <section>
          <h2 className="text-xl font-semibold mt-6 mb-2">8️⃣ 공감 표현 (ask at least 2)</h2>
          <ul className="list-decimal list-inside space-y-1">
            <li>그거 정말 지루하겠다</li>
            <li>저 피자 엄청 맛있겠다</li>
            <li>너 진짜 피곤하겠다</li>
            <li>그 시험 엄청 어렵겠다</li>
            <li>엄청 스트레스 받겠다</li>
          </ul>
        </section>
      
      <br />
      {/* Timer 25 minute mark */}
      <h2 className="text-2xl font-bold">🕒 Timer: 25 minute mark</h2>

              {/* 9️⃣ 인사 표현 / 대화 표현 */}
              <section>
          <h2 className="text-xl font-semibold mt-6 mb-2">9️⃣ 인사 표현 / 대화 표현 (ask at least 3)</h2>
          <ul className="list-decimal list-inside space-y-1">
            <li>주말에 재미있는거 했어?</li>
            <li>일 외로 다른 것도 하셨나요?</li>
            <li>일 외로는 특별한 것 없었습니다</li>
            <li>아무것도 안했어</li>
            <li>일하느라 바빴어.</li>
            <li>친구랑 이야기하느라 바빴어.</li>
            <li>어땠어? 재미있었어? → 네 재미있었어요!</li>
            <li>홍대에 사람이 많아</li>
          </ul>
        </section>

        {/* 🔟 비교급 */}
        <section>
          <h2 className="text-xl font-semibold mt-6 mb-2">🔟 비교급 (ask at least 3)</h2>
          <ul className="list-decimal list-inside space-y-1">
            <li>맥주가 소주보다 좋은데 와인이 최고야</li>
            <li>맥주가 소주보다 비싼데 와인이 제일 비싸</li>
            <li>제 방은 거의 고시원 만큼 작아요</li>
            <li>미국은 캐나다 만큼 멀어요</li>
            <li>교촌이 BBQ보다 맛있지만 푸라닥이 가장 맛있어요.</li>
            <li>어제보다 기분이 나아요.</li>
            <li>너 영어 많이 늘었다!</li>
            <li>저 골프 많이 늘었어요.</li>
            <li>데이빗이 아팠는데 좋아졌어요.</li>
            <li>사라가 영어 실력이 좋아졌어요. 이제 거의 [데이비드만큼 잘해요].</li>
          </ul>
        </section>

        {/* 1️⃣1️⃣ 횟수 */}
        <section>
          <h2 className="text-xl font-semibold mt-6 mb-2">1️⃣1️⃣ 횟수 (ask at least 2)</h2>
          <ul className="list-decimal list-inside space-y-1">
            <li>저는 보통 가족을 한달에 4번 정도 봐요</li>
            <li>저는 2주에 1번 정도 운동을 하는 것 같아요</li>
            <li>주 3회 영어 공부하기 시작했어요.</li>
            <li>저는 3달에 2번 정도 여행을 가요</li>
          </ul>
        </section>

        {/* 1️⃣2️⃣ 부정 질문 */}
        <section>
          <h2 className="text-xl font-semibold mt-6 mb-2">1️⃣2️⃣ 부정 질문 (ask at least 2)</h2>
          <ul className="list-decimal list-inside space-y-1">
            <li>너 돈 있지 않아?</li>
            <li>너 안배고파?</li>
            <li>너 안피곤해?</li>
            <li>너 저녁 안먹었어?</li>
            <li>너 여자친구 있지 않았어?</li>
            <li>저 여자애 영어 하지 않아?</li>
            <li>너 누나가 영국 살지 않아?</li>
            <li>다시 해보지 그래요? (why don’t you try again?)</li>
            <li>그냥 집에 있으면 안돼요? (can’t you just stay home?)</li>
            <li>이제 가는건 어때? (why don’t we go now?)</li>
            <li>이번엔 내가 내는게 어때? (why don’t I pay this time?)</li>
            <li>우리 그냥 내일 가면 안돼? (can’t we go tomorrow instead?)</li>
          </ul>
        </section>

        {/* 1️⃣3️⃣ Have + P.P. */}
        <section>
          <h2 className="text-xl font-semibold mt-6 mb-2">1️⃣3️⃣ Have + P.P. (3가지)</h2>
          <ul className="list-decimal list-inside space-y-1">
            <li>발리 가본적 있어?</li>
            <li>두리안 먹어본 적 있어?</li>
            <li>해리포터 본 적 있어?</li>
            <li>동방신기 들어본 적 있어?</li>
            <li>응 나 먹어봤지!</li>
            <li>아니 가본 적 없어</li>
            <li>한번도 들어본 적 없어</li>
            <li>한번도 가본 적 없어</li>
          </ul>
        </section>

    </div>
  );
}

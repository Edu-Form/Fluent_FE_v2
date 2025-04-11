// app/teacher/student/curriculum/beginner_pillar_expressions/page.tsx

"use client";

import React from "react";
import CurriculumLayout from "@/components/CurriculumnLayout";

export default function BeginnerPillarExpressionsPage({ searchParams }: { searchParams: any }) {
  const user = searchParams.user || "";
  const id = searchParams.id || "";
  const student_name = searchParams.student_name || "";
  return (
    <CurriculumLayout user={user} id={id} student_name={student_name}>
    <div className="p-6 space-y-6 max-h-[95vh] w-[85vw] overflow-auto">
      <h1 className="text-2xl font-bold mb-4">
        📘 Beginner Pillar Expressions
      </h1>

      <section className="bg-white p-4 rounded shadow space-y-3">
        <h2 className="text-xl font-semibold mb-2">
          1️⃣ Beginner Pillar Expressions (ask 20 out of the pool)
        </h2>
        <ul className="list-decimal list-inside space-y-1">
          <li>뭘 해야 할지 모르겠어.</li>
          <li>그 셔츠를 어디서 사야 할지 모르겠어.</li>
          <li>나 지금 시험 공부하고 있어.</li>
          <li>나 처음으로 초밥 먹어봤어.</li>
          <li>원하면 우리 영화 볼 수 있어.</li>
          <li>밖에 비 오고 있어.</li>
          <li>파리에 가고 싶어.</li>
          <li>방금 점심 다 먹었어.</li>
          <li>우리 산책했어.</li>
          <li>이 앱 사용하는 방법 알려줄 수 있어?</li>
          <li>어쨌든 다음 주제로 넘어가자.</li>
          <li>숙제 끝내야 해.</li>
          <li>오늘 좀 피곤해.</li>
          <li>다쳤어. / 아파.</li>
          <li>엄청 더워.</li>
          <li>규칙을 따라야 해.</li>
          <li>다음 주에 만나는 거 기대돼.</li>
          <li>인도 음식 먹어본 적 있어?</li>
          <li>돈 많이 벌고 싶어.</li>
          <li>출근하는 길이야.</li>
          <li>맛집 발견했어!</li>
          <li>건강하게 먹어야 해.</li>
          <li>오랜만에 옛 친구를 우연히 만났어.</li>
          <li>벌써 늦었네, 집에 가자.</li>
          <li>새로운 과제 하고 있어.</li>
          <li>새 컴퓨터 설정해야 해.</li>
          <li>&quot;스페인어로 안녕&quot;을 어떻게 말하는지 검색해봤어.</li>
          <li>그녀는 그림을 정말 잘 그려.</li>
          <li>외투 입어, 밖에 추워.</li>
          <li>우유 다 떨어졌어.</li>
          <li>약 받아와야 해.</li>
          <li>도와줄 수 있어?</li>
          <li>스페인어 배우는 것에 관심 있어.</li>
          <li>비행기 한 시간 후에 출발해.</li>
          <li>열쇠 찾고 있어.</li>
          <li>나가기 전에 문 꼭 잠가.</li>
          <li>새 차 마음에 들어.</li>
          <li>방금 집에 왔어.</li>
          <li>한국은 김치로 유명해.</li>
          <li>그럴 가치 없어.</li>
          <li>3일 연속으로.</li>
          <li>말했듯이.</li>
          <li>왕복 8시간 운전했어.</li>
          <li>추천해?</li>
          <li>누구한테 물어봐야 할지 모르겠어.</li>
          <li>자신이 없어.</li>
          <li>부산에서 해변 축제 하고 있었어.</li>
          <li>사진 보여줄게!</li>
          <li>돈 받았어?</li>
          <li>요금이 가성비 좋았어.</li>
          <li>벌금이 50만 원이었어.</li>
          <li>오랜만에 중학교 친구들 만났어.</li>
          <li>네가 원하는 대로 해도 돼.</li>
          <li>구체적으로,</li>
          <li>그녀가 나한테 교회 가라고 했어.</li>
          <li>그녀에게 가방 사줬어.</li>
          <li>그녀가 전화를 끊었어. / 내가 전화를 받았어.</li>
          <li>커뮤니티 행사 기대돼.</li>
          <li>아이들을 돌봐야 해.</li>
          <li>고양이 돌보느라 바빴어.</li>
          <li>블로그 써보는 게 좋을 것 같아.</li>
          <li>마음에 들었으면 좋겠어.</li>
          <li>잘됐으면 좋겠어.</li>
          <li>살 안 쪘으면 좋겠어. (살 좀 빠졌으면 좋겠어.)</li>
          <li>빨리 나았으면 좋겠어.</li>
          <li>이번 겨울에 한국에 있을 거야.</li>
          <li>그들이 나한테 음식 많이 사줬어.</li>
          <li>요즘 와인에 푹 빠졌어.</li>
          <li>실수하는 거 싫어.</li>
          <li>퇴근하고 나서 올래?</li>
          <li>안타깝게도,</li>
          <li>다행히도,</li>
          <li>나에 대해 말하자면,</li>
          <li>운전할지 자전거 탈지 고민했어.</li>
          <li>A를 할지 B를 할지.</li>
          <li>이건 습관이 되면 안 될 것 같아.</li>
          <li>미안해할 필요 없어. 괜찮아.</li>
          <li>근데 장소가 어디였지?</li>
          <li>그녀가 나한테 3만 원 빌렸어.</li>
          <li>이 가방 7만 7천 원이야.</li>
          <li>대화가 이상하게 흘러갔어.</li>
          <li>결론적으로, 프로젝트는 성공했어.</li>
          <li>요약하자면, 올해 목표를 달성했어.</li>
          <li>전체적으로, 정말 좋은 경험이었어.</li>
          <li>운동한 지 5년 됐어.</li>
          <li>결국, 다 잘 해결됐어.</li>
          <li>돈 낭비였어.</li>
          <li>보통,</li>
          <li>원래,</li>
          <li>결국,</li>
          <li>하루 종일,</li>
          <li>그녀는 스페인에 안 가기로 했어.</li>
          <li>내성적인 사람 / 외향적인 사람</li>
          <li>“편리하다”를 영어로 어떻게 말해? &apos;convenient&apos;이라고 해.</li>
          <li>“convenient”가 무슨 뜻이야? “편리하다”라는 뜻이야.</li>
          <li>어제 쉬는 날이었어.</li>
          <li>오늘 재미있게 보내길 바래!</li>
          <li>지난번이랑 완전 똑같아.</li>
          <li>그녀를 다시 만날지 고민 중이야.</li>
          <li>회의 말고 다른 재미있는 일 했어?</li>
          <li>다음 행사에 참석 못 해?</li>
          <li>그거 무례한 거 아니야?</li>
          <li>네가 원할 때 언제든 갈 수 있어.</li>
          <li>일하느라 바빴어.</li>
          <li>그녀가 연락할 때까지 그냥 기다리고 있어.</li>
          <li>힘들었어. / 즐거웠어.</li>
          <li>10시쯤 시작하자.</li>
          <li>약속</li>
          <li>시험 잘 봐!</li>
          <li>빨리 나았으면 좋겠어.</li>
          <li>잘됐으면 좋겠어.</li>
          <li>살 안 쪘으면 좋겠어.</li>
          <li>빨리 나았으면 좋겠어.</li>
          <li>더치페이하자.</li>
          <li>미안, 이 전화 받아야 해.</li>
          <li>이 전화 받아도 돼? 중요한 거야.</li>
          <li>~해도 괜찮아? 응, 괜찮아.</li>
          <li>A 대신 B를 샀어.</li>
        </ul>
      </section>

      <section className="bg-white p-4 rounded shadow space-y-3">
        <h2 className="text-xl font-semibold mb-2">
          2️⃣ Beginner Pillar Expressions
        </h2>
        <ul className="list-decimal list-inside space-y-1">
          <li>I don&apos;t know what to do (move to intermediate?)</li>
          <li>I don&apos;t know where to buy that shirt. (move to intermediate?)</li>
          <li>I&apos;m currently studying for my exams.</li>
          <li>I tried sushi for the first time.</li>
          <li>If you want, we can watch a movie.</li>
          <li>It&apos;s raining outside.</li>
          <li>I want to visit Paris.</li>
          <li>I just finished my lunch.</li>
          <li>We took a walk.</li>
          <li>Can you show me how to use this app?</li>
          <li>Anyway, let&apos;s move on to the next topic.</li>
          <li>I need to finish my homework.</li>
          <li>I&apos;m feeling a little tired today.</li>
          <li>I got hurt. / I&apos;m sick</li>
          <li>It&apos;s super hot.</li>
          <li>You must follow the rules.</li>
          <li>I look forward to seeing you next week.</li>
          <li>Have you ever tried Indian food?</li>
          <li>I want to earn a lot of money.</li>
          <li>I&apos;m on the way to work.</li>
          <li>I found a great restaurant!</li>
          <li>You should eat healthy.</li>
          <li>I ran into an old friend.</li>
          <li>It&apos;s late already, let&apos;s go home.</li>
          <li>I&apos;m working on a new assignment.</li>
          <li>I need to set up my new computer.</li>
          <li>I looked up “how to say hi in Spanish.”</li>
          <li>She&apos;s really good at painting.</li>
          <li>Put on your jacket. It&apos;s cold outside.</li>
          <li>We ran out of milk.</li>
          <li>I need to pick up my medicine.</li>
          <li>Can you give me a hand?</li>
          <li>I&apos;m interested in learning Spanish.</li>
          <li>My flight will take off in an hour.</li>
          <li>I&apos;m looking for my keys.</li>
          <li>Make sure you lock the door before you leave.</li>
          <li>I&apos;m satisfied with my new car.</li>
          <li>I just came back home</li>
          <li>Korea is famous for Kimchi</li>
          <li>it&apos;s not worth it</li>
          <li>three days in a row</li>
          <li>As I said / As I told you / As I mentioned</li>
          <li>
            I drove for 8 hours there and back (two ways) (back and forth)
          </li>
          <li>Do you recommend it?</li>
          <li>I don&apos;t know who to ask</li>
          <li>I&apos;m not confident</li>
          <li>Busan was holding a beach festival</li>
          <li>I&apos;ll show you a picture!</li>
          <li>Did you get paid yet?</li>
          <li>The fee was very cost efficient</li>
          <li>The fine was 500,000 won</li>
          <li>
            I met my middle school friends for the first time in a while (first
            time in a long time)
          </li>
          <li>You can do whatever you want</li>
          <li>Specifically,</li>
          <li>she wanted me to go to church</li>
          <li>I bought her a bag</li>
          <li>She hung up the phone / I picked up the phone</li>
          <li>I&apos;m looking forward to the community event</li>
          <li>I have to take care of my kids</li>
          <li>I was busy taking care of my cats</li>
          <li>I think you should write a blog</li>
          <li>I hope you like it (move to intermediate?)</li>
          <li>I hope [it goes well] (move to intermediate?)</li>
          <li>
            I hope I don&apos;t gain weight (lose weight) (move to intermediate?)
          </li>
          <li>I hope you get better (move to intermediate?)</li>
          <li>I&apos;m gonna be in korea this winter</li>
          <li>They bought me a lot of food</li>
          <li>I&apos;m really into wine these days</li>
          <li>I don&apos;t like making mistakes</li>
          <li>Why don&apos;t you come after getting off work?</li>
          <li>Unfortunately,</li>
          <li>Thankfully,</li>
          <li>To tell you about myself,</li>
          <li>I was deciding [whether to drive or to ride a bike].</li>
          <li>Whether to do A or B</li>
          <li>I don&apos;t think this should be a habit</li>
          <li>you dont have to be sorry. it&apos;s okay</li>
          <li>By the way, where is the venue again?</li>
          <li>she owes me 30,000won</li>
          <li>This bag costs 77,000won</li>
          <li>the conversation got weird</li>
          <li>In conclusion, the project was a success.</li>
          <li>In summary, we achieved our goals this year.</li>
          <li>All in all, it was a great experience.</li>
          <li>I&apos;ve worked out for 5 years now</li>
          <li>In the end, everything worked out fine.</li>
          <li>it was a waste of money</li>
          <li>Normally,</li>
          <li>Originally,</li>
          <li>Eventually,</li>
          <li>for the whole day</li>
          <li>she decided not to go to spain</li>
          <li>an introvert / an extrovert</li>
          <li>how do you say &quot;편리하다&quot; in english? you say &quot;convenient&quot;</li>
          <li>what does &quot;convenient&quot; mean? it means &quot;편리하다&quot;</li>
          <li>yesterday was my day off</li>
          <li>I want you to have fun today!</li>
          <li>it&apos;s exactly the same as last time</li>
          <li>I am deciding whether to meet her again or not</li>
          <li>other than the meeting, did you do anything fun?</li>
          <li>can&apos;t I attend the next event?</li>
          <li>isn&apos;t that rude?</li>
          <li>I can come whenever you want</li>
          <li>I was busy with work</li>
          <li>I&apos;m just waiting for her to contact me.</li>
          <li>I had a hard time / I had a good time</li>
          <li>let&apos;s start at like 10 ish</li>
          <li>Appointment</li>
          <li>good luck with your exams</li>
          <li>I hope you get better</li>
          <li>I hope [it goes well]</li>
          <li>I hope I don&apos;t gain weight</li>
          <li>I hope you get better</li>
          <li>let&apos;s split the bill</li>
          <li>oh sorry I have to take this call.</li>
          <li>can I take this call? it&apos;s important.</li>
          <li>Do you mind [if I do ~]? &gt; no, I don&apos;t mind</li>
          <li>I bought A instead of B</li>
        </ul>
      </section>

      <h2 className="text-2xl font-bold">🕒 Timer: 45 minute mark</h2>
    </div>
  </CurriculumLayout>
  );
}

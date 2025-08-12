// app/api/test/route.ts
import { NextResponse } from 'next/server';
import {
  getTestData,
  saveOrUpdateTestData,
} from '@/lib/data';


const templates: Record<string, string> = {
  "Beginner: Collect Bulk Answers": `
<h1>Paste student answers written for homework here</h1>

<p>
  The bulk answers should be 5~10 sentences and include the grammar that you learned in the beginner curriculum.
</p>

<h2>Common Questions (ask all)</h2>
<ul>
  <li><strong>Hi XX, long time no see, can you introduce yourself?</strong> <em>[talking about oneself] [Must memorize]</em></li>
  <li><strong>What are your hobbies?</strong> <em>[Verbal Nouns] [Like to]</em></li>
  <li><strong>What do you do? (what is your job?)</strong></li>
  <li><strong>Tell me more about your job.</strong> <em>[Must memorize]</em></li>
</ul>

<p><strong>Timer:</strong> 10 minute mark</p>

<h2>Additional Questions (All 5 questions are mandatory)</h2>
<p><em>(Must say this in bulk) (5~10 sentences)</em></p>
<ul>
  <li><strong>What did you do today / this morning / yesterday?</strong> <em>[past tense]</em></li>
  <li><strong>What are you going to do tomorrow/ on the weekend?</strong> <em>[future tense] [be going to V]</em></li>
  <li><strong>Can you tell me about your best friend?</strong> <em>[3rd person singular] [likes / does / is]</em></li>
  <li><strong>Can you tell me about a close coworker or colleague?</strong></li>
</ul>

<h2>주제별 질문</h2>

<h3>Family</h3>
<ul>
  <li><strong>Tell me about your family in detail.</strong> How many members are there? What do they do?</li>
  <li><strong>Let’s have a short conversation.</strong> Please ask me at least 5 questions about my family during the conversation.</li>
</ul>

<h3>Neighborhood</h3>
<ul>
  <li><strong>What neighborhood do you live in?</strong> Tell me in detail.</li>
  <li><strong>What do you like about your neighborhood?</strong> What are the characteristics?</li>
</ul>

<h3>House</h3>
<ul>
  <li><strong>Tell me about your house in detail.</strong></li>
  <li><strong>Tell me about your room?</strong></li>
  <li><strong>Let’s have a short conversation.</strong> Please ask me at least 5 questions about your house and neighborhood.</li>
</ul>

<h2>Question Bank</h2>

<h3>Family 질문</h3>
<p><em>(make sure they ask at least 5 questions when talking to you)</em></p>
<ul>
  <li>가족을 얼마나 자주 보나요?</li>
  <li>가족에 대해 말해주세요</li>
  <li>가족 인원이 몇명인가요?</li>
  <li>형재 자매가 몇명인가요?</li>
  <li>가족과 친한가요?</li>
  <li>부모님에 대해 말해주세요</li>
  <li>어떤 일을 하시나요?</li>
  <li>남편은 어떤 회사에서 일하시나요?</li>
  <li>아드님은 미래에 뭘 하실 계획인가요?</li>
  <li>혼자 사세요? 아니면 부모님이랑 사시나요?</li>
  <li>가족 중 누구랑 가장 친한가요?</li>
  <li>형제자매랑 나이 차이가 어떻게 되나요?</li>
  <li>몇살 더 많아요?</li>
  <li>직업들이 어떻게 되시나요?</li>
</ul>

<h3>House 질문</h3>
<p><em>(make sure they ask at least 5 questions when talking to you)</em></p>
<ul>
  <li>몇층에 사시나요?</li>
  <li>아파트 사세요 집에 사세요?</li>
  <li>저는 이 집에 3년동안 살았습니다</li>
  <li>경치가 좋아요</li>
  <li>집의 가장 마음에 드는 방이 어디에요?</li>
  <li>집의 가장 마음에 드는 가구가 뭐에요?</li>
  <li>어떤 동네에 사시나요?</li>
  <li>이 지역에 얼마나 오래 살았어요?</li>
  <li>그게 홈플러스 근처인가요?</li>
  <li>이사하고 싶어요?</li>
  <li>집에 만족하시나요?</li>
</ul>
`,
  "Beginner: Filter Grammer": `
 <h1>Grammar Questions (번역시험)</h1>
<p><strong>Instructions:</strong> Erase the ones that the student gets right. Ask at least 3 questions for each group unless otherwise noted.</p>

<h2>시간 & 날짜</h2>
<ul>
  <li>오늘 몇일인가요? → 2월 12일 입니다.</li>
  <li>생일이 언제인가요? → 5월 31일 입니다.</li>
  <li>7월 20일 / 11월 30일 / 2월 12일 / 4월 15일</li>
  <li>무슨 요일인가요? → 오늘은 수요일이에요</li>
  <li>지금 몇시인지 아시나요? → 지금 12시 반이에요</li>
  <li>학원 오는데 얼마나 걸리나요? → 한 30분 정도 걸려요 (it takes about half an hour)</li>
  <li>미국 언제 갈꺼야? → 8월 7일쯤 갈거야.</li>
</ul>

<h3>Sequence Expressions</h3>
<ul>
  <li>아침 먹고 나서 2가지</li>
  <li>퇴근 하고 나서 2가지</li>
  <li>출근 하고 나서 2가지</li>
</ul>

<h2>과거형 / be 동사 / 일반동사 / 질문 (ask at least 6)</h2>
<ul>
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
  <li>어떤 영화를 봤어?</li>
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

<h2>미래형 (ask at least 3)</h2>
<p><em>(make sure they know both "be going to V" & "will")</em></p>
<ul>
  <li>내일 뭐할거니? (will & be going to V)</li>
  <li>너 주말에 뭐할거야? (2가지 방법)</li>
  <li>토요일에 나 친구 만나러 강남갈거야</li>
  <li>우리 아마 저녁 먹고 수다 떨기 위해 카페갈거야</li>
  <li>나 내일 미국으로 여행갈거야</li>
  <li>나 오늘 수업 끝나고 집 가서 넷플릭스 볼거야 너는?</li>
  <li>너는 오늘 수업 끝나고 뭐할거니?</li>
</ul>

<h2>to 부정사 8개 (ask at least 3)</h2>
<ul>
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

<p><strong>Timer:</strong> 20 minute mark</p>

<h2>"위해"의 2가지 (to V / for N) (ask at least 3)</h2>
<ul>
  <li>나는 친구를 만나기 위해 홍대에 갔어</li>
  <li>나는 부모님을 뵙기 위해 일본에 갔어</li>
  <li>나갈 준비를 했어. / 출근 준비를 했어.</li>
  <li>친구들을 만나러 홍대에 갔어.</li>
  <li>수업을 위해 홍대에 왔어.</li>
  <li>나 너를 위해 선물 샀어</li>
</ul>

<h2>동안 3가지 (ask at least 3)</h2>
<ul>
  <li>나는 아침을 먹는 동안 티비를 봤어</li>
  <li>나는 휴가 동안 집에 있었어</li>
  <li>3시간 동안 울었어</li>
  <li>일 년 동안 영어 공부했어</li>
  <li>방학 동안 나는 미국에 갔어</li>
  <li>집에 있는 동안 유투브를 봤어</li>
</ul>

<h2>-ing 표현 (ask at least 5)</h2>
<ul>
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
  <li>난 기다리고 있어 그녀가 나한테 연락하길 (I’m waiting for her to contact me)</li>
  <li>그는 졸려지기 시작했어 (I’m starting to get sleepy)</li>
  <li>나 취할 예정이야 (I’m planning to get drunk)</li>
  <li>나 라면 먹으러 갈려고 했는데, 시간이 부족했어. (I was planning to go eat ramen but I didn't have enough time)</li>
</ul>

<h2>공감 표현 empathy expressions (ask at least 2)</h2>
<ul>
  <li>그거 정말 지루하겠다</li>
  <li>저 피자 엄청 맛있겠다</li>
  <li>너 진짜 피곤하겠다</li>
  <li>그 시험 엄청 어렵겠다</li>
  <li>엄청 스트레스 받겠다 (that must be stressful)</li>
</ul>

<p><strong>Timer:</strong> 25 minute mark</p>

<h2>인사 표현 / 대화 표현 (ask at least 3)</h2>
<ul>
  <li>주말에 재미있는거 했어?</li>
  <li>일 외로 다른 것도 하셨나요?</li>
  <li>일 외로는 특별한 것 없었습니다</li>
  <li>아무것도 안했어</li>
  <li>일하느라 바빴어.</li>
  <li>친구랑 이야기하느라 바빴어.</li>
  <li>어땠어? 재미있었어? → 네 재미있었어요!</li>
  <li>홍대에 사람이 많아</li>
</ul>

<h2>비교급 (ask at least 3)</h2>
<ul>
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

<h2>횟수 (ask at least 2)</h2>
<ul>
  <li>저는 보통 가족을 한달에 4번 정도 봐요</li>
  <li>저는 2주에 1번 정도 운동을 하는 것 같아요</li>
  <li>주 3회 영어 공부하기 시작했어요.</li>
  <li>저는 3달에 2번 정도 여행을 가요</li>
</ul>

<h2>부정 질문 (ask at least 2)</h2>
<ul>
  <li>너 돈 있지 않아?</li>
  <li>너 안배고파?</li>
  <li>너 안피곤해?</li>
  <li>너 저녁 안먹었어?</li>
  <li>너 여자친구 있지 않았어?</li>
  <li>저 여자애 영어 하지 않아?</li>
  <li>너 누나가 영국 살지 않아?</li>
  <li>다시 해보지 그래요? (why don’t you try again?)</li>
  <li>그냥 집에 있으면 안돼요? (can’t you just stay home?)</li>
  <li>이제 가는건 어때? why don’t we go now?</li>
  <li>이번엔 내가 내는게 어때? why don’t I pay this time?</li>
  <li>우리 그냥 내일 가면 안돼? can’t we go tomorrow instead?</li>
</ul>

<h2>Have + P.P. (3가지)</h2>
<ul>
  <li>발리 가본적 있어?</li>
  <li>두리안 먹어본 적 있어?</li>
  <li>해리포터 본 적 있어?</li>
  <li>동방신기 들어본 적 있어?</li>
  <li>응 나 먹어봤지!</li>
  <li>아니 가본 적 없어</li>
  <li>한번도 들어본 적 없어</li>
  <li>한번도 가본 적 없어</li>
</ul>

<h2>Family 질문 (ask at least 5)</h2>
<ul>
  <li>가족을 얼마나 자주 보나요?</li>
  <li>가족에 대해 말해주세요</li>
  <li>가족 인원이 몇명인가요?</li>
  <li>형재 자매가 몇명인가요?</li>
  <li>가족과 친한가요?</li>
  <li>부모님에 대해 말해주세요</li>
  <li>어떤 일을 하시나요?</li>
  <li>남편은 어떤 회사에서 일하시나요?</li>
  <li>아드님은 미래에 뭘 하실 계획인가요?</li>
  <li>혼자 사세요? 아니면 부모님이랑 사시나요?</li>
  <li>가족 중 누구랑 가장 친한가요?</li>
  <li>형제자매랑 나이 차이가 어떻게 되나요?</li>
  <li>몇살 더 많아요?</li>
  <li>직업들이 어떻게 되시나요?</li>
</ul>

<h2>House 질문 (ask at least 5)</h2>
<ul>
  <li>몇층에 사시나요?</li>
  <li>아파트 사세요 집에 사세요?</li>
  <li>저는 이 집에 3년동안 살았습니다</li>
  <li>경치가 좋아요</li>
  <li>집의 가장 마음에 드는 방이 어디에요?</li>
  <li>집의 가장 마음에 드는 가구가 뭐에요?</li>
  <li>어떤 동네에 사시나요?</li>
  <li>이 지역에 얼마나 오래 살았어요?</li>
  <li>그게 홈플러스 근처인가요?</li>
  <li>이사하고 싶어요?</li>
  <li>집에 만족하시나요?</li>
</ul>
`,
  "Beginner: Filter Pillar Expressions": `
<h1>Beginner Pillar Expressions</h1>
<p><strong>Instruction:</strong> Ask 20 expressions out of the pool below. Erase the ones that the student gets right.</p>

<ul>
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
  <li>"스페인어로 안녕"을 어떻게 말하는지 검색해봤어.</li>
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
  <li>구체적으로, 그녀가 나한테 교회 가라고 했어.</li>
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
  <li>안타깝게도, 다행히도, 나에 대해 말하자면,</li>
  <li>운전할지 자전거 탈지 고민했어.</li>
  <li>A를 할지 B를 할지.</li>
  <li>이건 습관이 되면 안 될 것 같아.</li>
  <li>미안해할 필요 없어.</li>
  <li>괜찮아.</li>
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
  <li>보통, 원래, 결국, 하루 종일,</li>
  <li>그녀는 스페인에 안 가기로 했어.</li>
  <li>내성적인 사람 / 외향적인 사람</li>
  <li>“편리하다”를 영어로 어떻게 말해? → “convenient”이라고 해.</li>
  <li>“convenient”가 무슨 뜻이야? → “편리하다”라는 뜻이야.</li>
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
  <li>조금 짜증났어</li>
  <li>살짝 민망해 (쪽팔려)</li>
  <li>검색했어 (검색해봤어)</li>
  <li>내일모레레</li>
  <li>미안, 나 이 전화 받아야해</li>
  <li>잘 되길 바래</li>
  <li>나 살 안쪘으면 좋겠다</li>
  <li>약속 (일정 약속)</li>
</ul>

`,
  "Beginner: Actual Level Test": `
<h1>The Test Starts Here</h1>
<p><strong>Timer:</strong> 0 minute mark</p>

<hr>

<h2>Basic Questions</h2>
<p><strong>Date:</strong> (한국말로 물어보고 답하기)</p>
<ul>
  <li>오늘 날짜가 어떻게 되나요?</li>
  <li>오늘 무슨 요일인가요?</li>
</ul>

<h3>Greet the Teacher</h3>
<ul>
  <li>Can you say hi to me in 3 different ways? (aim for the harder ones)</li>
  <li>How are you today? → I’m good and you?</li>
  <li>How was your day? → It was good and yours?</li>
  <li>What did you do today? → There was nothing special</li>
  <li>How have you been? → I’ve been good</li>
  <li>How is it going? → It’s going well</li>
  <li>How are you doing? → I’m doing well</li>
  <li>What’s going on? → Nothing special</li>
  <li>What’s up? → Nothing much</li>
  <li>How is everything? → Everything is good</li>
  <li>Is everything going well? → Yeah, everything’s good</li>
  <li>What’s on your mind? → Nothing much (there’s nothing on my mind)</li>
  <li>It’s been a while! Long time no see → Yeah it’s been a while! How are you? Let’s catch up sometime!</li>
</ul>

<hr>

<h2>Common Questions (ask all)</h2>
<ul>
  <li>Hi XX, long time no see, can you introduce yourself? <em>[talking about oneself] [Must memorize]</em></li>
  <li>What are your hobbies? Tell me in more detail. <em>[Verbal Nouns] [Like to]</em></li>
  <li>What do you do? (what is your job?)</li>
  <li>Tell me more about your job. <em>[Must memorize]</em></li>
</ul>

<p><strong>Timer:</strong> 10 minute mark</p>

<hr>

<h2>Additional Questions (All 5 questions are mandatory)</h2>
<p><em>(Must say this in bulk / 5–10 sentences)</em></p>
<ul>
  <li>What did you do today / this morning / yesterday? <em>[past tense]</em></li>
  <li>What are you going to do tomorrow/ on the weekend? <em>[future tense] [be going to V]</em></li>
  <li>Can you tell me about your best friend? <em>[3rd person singular] [likes / does / is]</em></li>
  <li>Can you tell me about a close coworker or colleague?</li>
</ul>

<p><strong>Timer:</strong> 15 minute mark</p>

<hr>

<h2>Grammar Questions (번역시험)</h2>
<p><strong>(Ask at least 3 questions for each group)</strong></p>

<h3>시간 & 날짜</h3>
<ul>
  <li>오늘 몇일인가요? → 2월 12일 입니다.</li>
  <li>생일이 언제인가요? → 5월 31일 입니다.</li>
  <li>7월 20일 / 11월 30일 / 2월 12일 / 4월 15일</li>
  <li>무슨 요일인가요? → 오늘은 수요일이에요</li>
  <li>지금 몇시인지 아시나요? → 지금 12시 반이에요</li>
  <li>학원 오는데 얼마나 걸리나요? → 한 30분 정도 걸려요</li>
  <li>미국 언제 갈꺼야? → 8월 7일쯤 갈거야.</li>
  <li>아침 먹고 나서 2가지</li>
  <li>퇴근 하고 나서 2가지</li>
  <li>출근 하고 나서 2가지</li>
</ul>

<h3>과거형 / be 동사 / 일반동사 / 질문 (ask at least 6)</h3>
<ul>
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
  <li>어떤 영화를 봤어?</li>
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

<h3>미래형 (ask at least 3)</h3>
<p><em>(Make sure they know both be going to V & will)</em></p>
<ul>
  <li>내일 뭐할거니? (will & be going to V)</li>
  <li>너 주말에 뭐할거야? (2가지 방법)</li>
  <li>토요일에 나 친구 만나러 강남갈거야</li>
  <li>우리 아마 저녁 먹고 수다 떨기 위해 카페갈거야</li>
  <li>나 내일 미국으로 여행갈거야</li>
  <li>나 오늘 수업 끝나고 집 가서 넷플릭스 볼거야 너는?</li>
  <li>너는 오늘 수업 끝나고 뭐할거니?</li>
</ul>

<h3>to 부정사 (ask at least 3)</h3>
<ul>
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

<h3>위해의 2가지 to V / for N (ask at least 3)</h3>
<ul>
  <li>나는 친구를 만나기 위해 홍대에 갔어</li>
  <li>나는 부모님을 뵙기 위해 일본에 갔어</li>
  <li>나갈 준비를 했어. / 출근 준비를 했어.</li>
  <li>친구들을 만나러 홍대에 갔어.</li>
  <li>수업을 위해 홍대에 왔어.</li>
  <li>나 너를 위해 선물 샀어</li>
  <li>나는 2년 동안 일 하러 일본에 가고 싶어</li>
  <li>내 커리어를 위해</li>
</ul>

<h3>동안 (ask at least 3)</h3>
<ul>
  <li>나는 아침을 먹는 동안 티비를 봤어</li>
  <li>나는 휴가 동안 집에 있었어</li>
  <li>3시간 동안 울었어</li>
  <li>일 년 동안 영어 공부했어</li>
  <li>방학 동안 나는 미국에 갔어</li>
  <li>집에 있는 동안 유투브를 봤어</li>
  <li>제가 술을 마시는 동안 비가 그쳤어요</li>
  <li>공부를 하는 동안 배가 고파졌어요</li>
</ul>

<h3>ing 4가지 표현 (ask at least 5)</h3>
  <p>운동하는 것은 재미있어</p>
  <p>요즘 저는 미국을 가기 위해 영어 공부를 하고 있어요</p>
  <p>나는 피곤했지만 계속 일했어</p>
  <p>나는 취했지만 계속 술을 마셨어</p>
  <p>술은 몸에 안 좋아</p>
  <p>나는 공부하는 것을 좋아해</p>
  <p>나는 피곤했지만 계속 퀴즐렛을 공부했어</p>
  <p>운동은 건강에 좋아</p>
  <p>나는 요즘 여행하는 중이야</p>
  <p>여행하는 것은 내 꿈이야</p>
  <p>나는 어제 축구하는 동안 넘어졌어</p>
  <p>그것은 피곤했어</p>
  <p>TV 보는 것은 재미있어</p>
  <p>나 뛸 거야 / 나 골프 잘쳐 / 나 요리 못해</p>
  <p>난 그녀가 나한테 연락하길 기다리고 있어 <b>(I’m waiting for her to contact me)</b></p>
  <p>그는 졸려지기 시작했어 <b>(I’m starting to get sleepy)</b></p>
  <p>나 취할 예정이야 <b>(I’m planning to get drunk)</b></p>
  <p>나 라면 먹으러 갈려고 했는데, 시간이 부족했어 <b>(I was planning to go eat ramen but I didn't have enough time)</b></p>

  <h3>공감 표현 (ask at least 2)</h3>
  <p>그거 정말 지루하겠다</p>
  <p>저 피자 엄청 맛있겠다</p>
  <p>너 진짜 피곤하겠다</p>
  <p>그 시험 엄청 어렵겠다</p>
  <p>그거 엄청 스트레스 받겠다</p>
  <p>너 엄청 스트레스 받겠다</p>
  <p>너네 강아지 진짜 배고프겠다</p>
  <p>너 진짜 속상하겠다 / 그거 진짜 속상하겠다 <b>(that must be upsetting)</b></p>
  <p>그거 엄청 흥미롭겠는걸? <b>(that sounds interesting)</b></p>
  <p>저거 내 차 같이 생겼다</p>
  <p>이 노래 kpop 같아</p>

  <h3>Timer: 25 minute mark</h3>

  <h3>추가 필수 생활 표현 (ask at least 3)</h3>
  <p>주말에 재미있는거 했어?</p>
  <p>일 외로 다른 것도 하셨나요?</p>
  <p>일 외로는 특별한 것 없었습니다</p>
  <p>아무것도 안했어</p>
  <p>일하느라 바빴어.</p>
  <p>친구랑 이야기하느라 바빴어.</p>
  <p>어땠어? 재미있었어? > 네 재미있었어요!</p>
  <p>홍대에 사람이 많아</p>

  <h3>비교급 (ask at least 3)</h3>
  <p>맥주가 소주보다 좋은데 와인이 최고야</p>
  <p>맥주가 소주보다 비싼데 와인이 제일 비싸</p>
  <p>제 방은 거의 고시원 만큼 작아요</p>
  <p>미국은 캐나다 만큼 멀어요</p>
  <p>교촌이 BBQ보다 맛있지만 푸라닥이 가장 맛있어요</p>
  <p>어제보다 기분이 나아요</p>
  <p>너 영어 많이 늘었다!</p>
  <p>저 골프 많이 늘었어요</p>
  <p>데이빗이 아팠는데 좋아졌어요</p>
  <p>사라가 영어 실력이 좋아졌어요. 이제 거의 <b>데이빗만큼 잘해요</b></p>
  <p>데이빗이 사라보다 더 좋은 학생이지만 제프가 가장 좋은 학생이에요</p>
  <p><b>조깅이 하이킹보다 더 힘들어요</b></p>

  <h3>횟수 (ask at least 2)</h3>
  <p>저는 보통 가족을 한달에 4번 정도 봐요</p>
  <p>저는 2주에 1번 정도 운동을 하는 것 같아요</p>
  <p>주 3회 영어 공부하기 시작했어요</p>
  <p>저는 3달에 2번 정도 여행을 가요</p>

  <h3>부정 질문 (ask at least 2)</h3>
  <p>너 돈 있지 않아?</p>
  <p>너 안배고파?</p>
  <p>너 안피곤해?</p>
  <p>너 저녁 안먹었어?</p>
  <p>너 여자친구 있지 않았어?</p>
  <p>저 여자애 영어 하지 않아?</p>
  <p>너 누나가 영국 살지 않아?</p>
  <p>다시 해보지 그래요? <b>(why don’t you try again?)</b></p>
  <p>그냥 집에 있으면 안돼요? <b>(can’t you just stay home?)</b></p>
  <p>지금 집에 가는 것은 어떨까? <b>(why don’t we go home now?)</b></p>
  <p>이번에 내가 내는 것은 어때? <b>(why don’t I pay this time?)</b></p>
  <p>우리 그냥 내일 가면 안돼? <b>(can’t we go tomorrow instead?)</b></p>

  <h3>have pp 표현 (3가지)</h3>
  <p>발리 가본적 있어?</p>
  <p>두리안 먹어본 적 있어?</p>
  <p>해리포터 본 적 있어?</p>
  <p>동방신기 들어본 적 있어?</p>
  <p>응 나 먹어봤지!</p>
  <p>아니 가본 적 없어</p>
  <p>한번도 들어본 적 없어</p>
  <p>한번도 가본 적 없어</p>

  <h3>Family</h3>
  <p>Tell me about your family in detail. How many members are there? What do they do?</p>
  <p>Let’s have a short conversation. Please ask me at least 5 questions about my family during the conversation.</p>
  <p>Please compare you and someone from your family <b>(just 3 sentences)</b></p>

  <p><b>Family Question Bank (ask at least 5):</b></p>
  <p>가족을 얼마나 자주 보나요?</p>
  <p>가족에 대해 말해주세요</p>
  <p>가족 인원이 몇명인가요?</p>
  <p>형재 자매가 몇명인가요?</p>
  <p>가족과 친한가요?</p>
  <p>부모님에 대해 말해주세요</p>
  <p>어떤 일을 하시나요?</p>
  <p>남편은 어떤 회사에서 일하시나요?</p>
  <p>아드님은 미래에 뭘 하실 계획인가요?</p>
  <p>혼자 사세요? 아니면 부모님이랑 사시나요?</p>
  <p>가족 중 누구랑 가장 친한가요?</p>
  <p>형제자매랑 나이 차이가 어떻게 되나요? 몇살 더 많아요?</p>
  <p>직업들이 어떻게 되시나요?</p>

  <h3>House & Neighborhood</h3>
  <p>What neighborhood do you live in? Tell me in detail.</p>
  <p>What do you like about your neighborhood? What are the characteristics?</p>
  <p>Tell me about your house in detail. Tell me about your room.</p>
  <p>Please compare your old neighborhood to your new neighborhood <b>(just 5 sentences)</b></p>
  <p>Let’s have a short conversation. Please ask me at least 5 questions about my house and neighborhood.</p>

  <p><b>House Question Bank (ask at least 5):</b></p>
  <p>몇층에 사시나요?</p>
  <p>아파트 사세요? 집에 사세요?</p>
  <p>저는 이 집에 3년동안 살았습니다</p>
  <p>경치가 좋아요</p>
  <p>집의 가장 마음에 드는 방이 어디에요?</p>
  <p>집의 가장 마음에 드는 가구가 뭐에요?</p>
  <p>집에 대해 가장 마음에 드는 점이 뭔가요?</p>
  <p>어떤 동네에 사시나요?</p>
  <p>이 지역에 얼마나 오래 살았어요?</p>
  <p>그게 홈플러스 근처인가요?</p>
  <p>이사하고 싶어요?</p>
  <p>집에 만족하시나요?</p>

  <h3>Timer: 40 minute mark</h3>

  <h3>Beginner Pillar Expressions (ask 20 out of the pool)</h3>
  <p>뭘 해야 할지 모르겠어.</p>
  <p>그 셔츠를 어디서 사야 할지 모르겠어.</p>
  <p>나 지금 시험 공부하고 있어.</p>
  <p>나 처음으로 초밥 먹어봤어.</p>
  <p>원하면 우리 영화 볼 수 있어.</p>
  <p>밖에 비 오고 있어.</p>
  <p>파리에 가고 싶어.</p>
  <p>방금 점심 다 먹었어.</p>
  <p>우리 산책했어.</p>
  <p>이 앱 사용하는 방법 알려줄 수 있어?</p>
  <p>어쨌든 다음 주제로 넘어가자.</p>
  <p>숙제 끝내야 해.</p>
  <p>오늘 좀 피곤해.</p>
  <p>다쳤어. / 아파.</p>
  <p>엄청 더워.</p>
  <p>규칙을 따라야 해.</p>
  <p>다음 주에 만나는 거 기대돼.</p>
  <p>인도 음식 먹어본 적 있어?</p>
  <p>돈 많이 벌고 싶어.</p>
  <p>출근하는 길이야.</p>
  <p>맛집 발견했어!</p>
  <p>건강하게 먹어야 해.</p>
  <p>오랜만에 옛 친구를 우연히 만났어.</p>
  <p>벌써 늦었네, 집에 가자.</p>
  <p>새로운 과제 하고 있어.</p>
  <p>새 컴퓨터 설정해야 해.</p>
  <p>"스페인어로 안녕"을 어떻게 말하는지 검색해봤어.</p>
  <p>그녀는 그림을 정말 잘 그려.</p>
  <p>외투 입어, 밖에 추워.</p>
  <p>우유 다 떨어졌어.</p>
  <p>약 받아와야 해.</p>
  <p>도와줄 수 있어?</p>
  <p>스페인어 배우는 것에 관심 있어.</p>
  <p>비행기 한 시간 후에 출발해.</p>
  <p>열쇠 찾고 있어.</p>
  <p>나가기 전에 문 꼭 잠가.</p>
  <p>새 차 마음에 들어.</p>
  <p>방금 집에 왔어.</p>
  <p>한국은 김치로 유명해.</p>

  <h3>Timer: 45 minute mark</h3>

`,
  "Intermediate: Collect Bulk Answers": `<h1>Student Homework Practice Questions</h1>

<h3>Common Questions (Ask All)</h3>
<p><b>Hi XX, long time no see, can you introduce yourself?</b> [talking about oneself] [Must memorize an upgraded version]</p>
<p><b>What are your hobbies nowadays? What are you into?</b> Tell me in detail (Or: tell me about your hobbies in more detail!) [Must memorize upgraded version]</p>
<p><b>What do you look forward to in your day?</b></p>
<p><b>What do you do?</b> (what is your job?) Tell me more about your job & company. [Must memorize upgraded version] (skip if it was mentioned in detail already)</p>
<p><b>Or:</b> tell me about being a student. How is it? Do you wanna grow up faster? (For students)</p>
<p><i>There may be follow-up questions to test their basic grammar and speed.</i></p>

<h3>Work Questions (Ask at least 3 that apply to them)</h3>
<p><i>There may be follow-up questions.</i></p>
<p><i>Looking for grammar mistakes, advanced grammar, intermediate vocabulary, speed, and flow.</i></p>
<p><b>Advanced grammar = Have pp, could, should, relative pronouns, verbal nouns, might</b></p>
<p>Tell me about a typical day at work</p>
<p>Tell me about your most recent project</p>
<p>What was your previous job?</p>
<p>Why are you taking a break from work?</p>
<p>How are you enjoying taking a break from school / work?</p>
<p>How is being a housewife treating you? (student / an employee)</p>
<p>Do you like your company or school? What about your major?</p>
<p>Tell me about your team and position</p>
<p>What do you plan to do for work in your future</p>
<p>Do you like school? How is it different from other schools?</p>
<p>Do you like your homeroom class? Your teacher?</p>
<p>Are there any professors / managers / coworkers that you like?</p>

<h3>Storytelling (Ask at least 2)</h3>
<p><i>Must use advanced grammar.</i></p>
<p><i>Good storytelling = characters, dialogue, and entertaining flow.</i></p>
<p>Tell me about something unexpected that happened recently</p>
<p>Tell me about the most memorable fight or argument you had</p>
<p>Tell me some office gossip</p>
<p>Tell me about a situation that annoyed you at work</p>
<p>Tell me about how your kids upset you or made you laugh</p>

<h3>Movies (Ask at least 2)</h3>
<p><i>Must use multiple relative pronouns & verbal nouns.</i></p>
<p>What movie did you watch recently? What was the story about in detail?</p>
<p>What is your all time favorite movie? Why do you like it?</p>
<p>Ask me 3 questions about my movie taste and recommend a movie</p>
<p>Tell me about your favorite actor/actress and what they were in</p>
<p>What TV program did you watch as a kid? What was it about?</p>

<h3>Drinking (Ask at least 2)</h3>
<p><i>All answers must include storytelling & advanced grammar</i></p>
<p>When is the last time that you drank?</p>
<p>Do you drink often?</p>
<p>Tell me about an embarrassing drinking experience</p>
<p>Recommend a pub and explain why you like it. What do they serve?</p>
<p>Ask me 5 drinking questions & have a conversation about it</p>

<h3>Dating (Ask at least 2)</h3>
<p><i>All answers must include storytelling & advanced grammar</i></p>
<p>Tell me about your most recent dating experience</p>
<p>Why didn’t it work out? / How is the relationship going?</p>
<p>What are your thoughts about marriage and kids?</p>
<p>What is your ideal type? Does that person match it?</p>
<p>Do you have a crush on someone? What kind of person are they?</p>
<p>Tell me about your ex (if okay)</p>
<p>Ask me 5 dating questions & have a conversation</p>

<h3>Being Sick (Ask at least 2)</h3>
<p><i>All answers must include storytelling & advanced grammar</i></p>
<p>Tell me about the last time you were sick. How did you recover?</p>
<p>Tell me about the last time you hurt yourself. What happened?</p>
<p>Are you stressed nowadays? How are you dealing with it?</p>
<p>When is the last time that you went to the hospital?</p>
<p>Ask me 5 questions about being sick or hurt & have a conversation</p>	
`,
  "Intermediate: Filter Grammer": `
<h1>Grammar: Verbal Nouns and Relative Pronouns (ask at least 7)</h1>
<p>저 여자가 [제가 어제 만난 여자]에요.</p>
<p>[제가 좋아했던 그 여자]가 이사 갔어요.</p>
<p>[제가 만난 그 남자]는 코미디언이었어요.</p>
<p>제가 [당신이 만난 사람]을 봤어요.</p>
<p>[제가 어제 뭘 했는지] 기억이 안 나요.</p>
<p>[그녀가 그것이 예쁘다고] 말했어요.</p>
<p>[제가 어릴 때], 저는 아팠어요.</p>
<p>제가 [왜 그녀가 화났는지] 모르겠어요.</p>
<p>제가 [당신이 어디 있는지] 알아요.</p>
<p>그게 [제가 우유를 못 마시는 이유]에요.</p>
<p>제가 [당신이 거짓말한 걸] 알아요.</p>
<p>[제가 예쁘지 않다고] 생각했어요.</p>
<p>제가 [1000원짜리 물]을 샀어요.</p>
<p>[제가 좋아하는 음식]은 피자예요.</p>
<p>[제가 일하는 회사]는 부산에 있어요.</p>
<p>제가 좋아하는 [여자를 만났어요].</p>
<p>[그게 바로 당신을 좋아하는 이유예요].</p>
<p>저는 유명한 영화인 포레스트 검프를 좋아해요</p>
<p>저는 유명한 kpop 보이그룹인 BTS를 좋아해요</p>
<p>저거 [내가 어제 산] 거야.</p>
<p>걔는 [내가 파티에서 만난] 여자애야.</p>
<p>나 [내가 매일 아침 가는] 카페에 갔어.</p>
<p>걔는 [내가 얘기했던] 남자야.</p>
<p>저거 [내가 지금 보고 있는] 프로그램이야.</p>
<p>걔는 [내가 매일 문자하는] 친구야.</p>
<p>저기가 [내가 식료품 사는] 곳이야.</p>
<p>저게 [내가 찾고 있던] 거야.</p>
<p>걔는 [내가 점심 같이 먹는] 사람이야.</p>
<p>이거 [내가 요즘 빠져있는] 게임이야.</p>
<p>저기가 [우리가 지난 금요일에 놀았던] 바야.</p>
<p>걔는 [내가 너한테 말했던] 사람이야.</p>
<p>저기가 [내가 밥 먹고 싶은] 식당이야.</p>
<p>이거 [모두가 얘기하고 있는] 영화야.</p>
<p>저거 [내가 항상 주문하는] 음식이야.</p>
<p>여기가 [내가 매 주말마다 술 마시는] 곳이야.</p>
<p>걔는 [나 이사하는 거 도와준] 친구야.</p>
<p>그때가 [내가 변해야겠다고 깨달은] 순간이야.</p>
<p>이게 [내가 항상 늦는] 이유야.</p>
<p>저게 [내가 한국을 떠나야 하는] 이유야.</p>
<p>나는 그가 내 이름을 기억하는지 궁금해.</p>
<p>나는 너가 여행을 즐겼기를 바래.</p>
<p>그녀는 왜 늦었는지 설명했어.</p>
<p>내가 이걸 제시간에 끝낼 수 있을지 확신이 안 서.</p>
<p>나는 오늘이 그녀의 생일이라는 걸 잊었어.</p>
<p>나는 네가 내일 쉬는 날인 걸 알기 때문에 계획을 세웠어.</p>
<p>그가 쓴 보고서가 이 프로젝트의 핵심 자료야.</p>
<p>그가 언급했던 프로젝트가 드디어 시작됐어.</p>
<p>[내가 다니는 헬스장은] 24시간 운영해.</p>
<p>[그녀가 요리한 음식이] 오늘의 메인 요리야.</p>
<p>[내가 매일 이용하는 지하철역이] 이번 주에 공사 중이야.</p>
<p>내일 [우리가 등산을 갈 수 있을지] 모르겠어. (whether / if)</p>
<p>나는 전을 먹었는데 그것은 한국 전통 펜케익 같은거야</p>
<p>나는 막걸리를 마셨는데 그것은 한국 전통 술의 종류야</p>
<p>나는 [그가 추천한 곳에] 못갔어</p>
<p>그곳은 [아이스크림을 파는 카페였어]</p>
<p>나는 [그가 얼마나 많이 마셨는지]에 충격 받았어.</p>
<p>나도 여의도에 [벚꽃이 많다는 것을] 알고 있어.</p>
<p>나 [그 영화 본 다른 학생을] 가르치고 있어.</p>
<p>그게 [내가 마지막으로 마셨을 때야].</p>
<p>[내가 예상한게] 아닌데.</p>

<h1>Talking to a Foreigner</h1>
<p>Let’s have a conversation. Please ask me about my childhood, where I grew up, and how I came to Korea.</p>
<p>(Make the student ask you about 5~10 questions about yourself and your foreign background)</p>
<p>Must use at least 5 of the following questions. The flow of questioning must be natural.</p>

<h3>Questions Bank — For David</h3>
<p>Where did you grow up?</p>
<p>Where in the states did you live?</p>
<p>What state are you from?</p>
<p>Do you miss living in America?</p>
<p>Are you planning to go back anytime soon?</p>
<p>Where do you like living better? Korea or the US?</p>
<p>How long has it been since you lived in the US?</p>
<p>What’s the best part about living in Korea? (being back in Korea)</p>
<p>Do you speak any other languages?</p>
<p>Did you live anywhere else other than the US? (any other countries)</p>
<p>Where did you go to school?</p>

<h3>For Other Teachers</h3>
<p>Are you teaching full time?</p>
<p>Where did you learn your English? (how to speak English)</p>
<p>How long did you live in ~</p>
<p>How long has it been since you came back to Korea?</p>
<p>What brings you back to Korea?</p>
<p>Are you staying for good? or are you just visiting for a while?</p>
<p>Where do you prefer living?</p>
<p>What do you miss about your home country?</p>
<p>Have you traveled in other countries as well?</p>
<p>Did you get to travel a lot in Korea?</p>
<p>What’s the best part about living in Germany?</p>
<p>How is Korea treating you?</p>
<p>What was your job back in California?</p>
<p>Are there any places you recommend to visit back in France?</p>
<p>How many languages do you speak?</p>
<p>How is Korea compared to Europe?</p>
<p>How’s the food treating you?</p>
`,
  "Intermediate: Filter Pillar Expressions": `
 <h1>Intermediate: Filter Pillar Expressions</h1>


<p><b>Erase the ones that the student gets right</b></p>


<h3>Intermediate Expressions &amp; Vocab Part 1</h3>


<p>이 영화 해리 포터랑 비슷해.</p>


<p>이거 우리가 지난주에 본 영화야(거야).</p>


<p>나 한국에서 제일 유명한 음식점 중 하나에서 밥 먹었어.</p>


<p>결론적으로 / 정리하자면</p>


<p>결국에는 / 마지막엔</p>


<p>그래서 결과적으로</p>


<p>내가 파티 안 간 이유는 일 때문에 너무 기빨려서였어.</p>


<p>내가 고향 마지막으로 방문한 게 엄청 오래됐어.</p>


<p>긍정적인 / 부정적인</p>


<p>부담 주지 마!</p>


<p>민망한 / 민망하게 하는</p>


<p>난 차라리 그 돈을 너한테 쓰고 싶어.</p>


<p>난 차라리 술 마시러 가는 것보다 운동하러 갈래.</p>


<p>나 질투나 / 부러워.</p>


<p>내가 말했는지 모르겠는데~</p>


<p>지난 2개월 동안.</p>


<p>나 정신적으로 무너졌어.</p>


<p>내가 알기로는.</p>


<p>네가 날 사랑하는 한.</p>


<p>최악의 상황은 뭐야?(최상의 상황은?)</p>


<p>오랜만에 옛 친구랑 만났어.</p>


<p>날씨에 달렸어.</p>


<p>가능하면 나중에 헬스장 갈 수도 있어.</p>


<p>보통 나는 매일 아침 7시에 일어나.</p>


<p>드디어 / 마침내</p>


<p>버스 놓쳤어. 그래서 늦었어.</p>


<p>등산이 힘들었지만, 가치 있었어.</p>


<p>어쩔 수 없어.</p>


<p>걔가 나한테 30만원 빚졌어.</p>


<p>개인적으로, 이게 최선의 선택인 것 같아.</p>


<p>대화가 이상해졌어.</p>


<p>우린 아직 서로 알아가는 중이야.</p>


<p>이 프로젝트를 통해 걔를 잘 알게 됐어.</p>


<p>결국 내가 그 행사에 자원봉사하게 됐어.</p>


<p>이거 좀 도와줄래?</p>


<p>걔는 내내 조용했어.</p>


<p>왠지 그 노래가 계속 생각나더라.</p>


<p>공부 더 열심히 했어야 했는데.</p>


<p>중간고사 거의 다 끝났어.</p>


<p>응원할게! / 너 응원해!</p>


<p>얼마나 오래 밖에 있었어?</p>


<p>어떻게 될지 두고 보자!</p>


<p>걔가 불쌍했어.</p>


<p>약 먹는 거 깜빡했어.</p>


<p>말 끊어서 미안해.</p>


<p>내 자신한테 너무 실망했어.</p>


<p>그냥 궁금한데, 어떤 영화 봤어?</p>


<p>내가 너라면 나도 긴장됐을 거야.</p>


<p>왠지 잠이 안 왔어.</p>


<p>대략 5만원 정도 했어.</p>


<p>시간이 지날수록</p>


<p>먹을수록 더 좋아져.</p>


<p>여자친구가 운전하지 말라고 했어.</p>


<p>우리 애들이 잘 지내서 다행이야.</p>


<h3>단어</h3>


<p>까다로운</p>
<p>정착하다</p>
<p>은퇴하다</p>
<p>고려하다</p>
<p>참조하다</p>
<p>~에 관해서</p>


<p>편리한</p>
<p>편안한</p>
<p>여유로운</p>
<p>지친</p>
<p>존중하는</p>
<p>장례식</p>
<p>공통 친구</p>


<p>아프다고 연락하다</p>
<p>집착하는</p>
<p>첫째로</p>
<p>둘째로</p>
<p>솔직한</p>
<p>직설적인</p>


<p>치아교정기</p>
<p>치실</p>
<p>정치</p>
<p>욕하기</p>
<p>욕설</p>
<p>장소</p>
<p>유행하는 것</p>


<p>음료수</p>
<p>음료</p>
<p>귀걸이</p>
<p>목걸이</p>
<p>팔찌</p>
<p>명백히</p>
<p>기술적으로</p>


<p>오글거리는</p>
<p>어색한</p>
<p>감당할 수 있는</p>
<p>처리하다</p>
<p>말이 돼!</p>


<p>내가 알아낼게</p>
<p>이제 괜찮아</p>
<p>기대돼</p>
<p>웃긴</p>


<h3>Intermediate Expressions &amp; Vocab Part 2</h3>


<p>우리가 지난번에 본 거 아니야?</p>


<p>나 모든 종류의 음악 좋아하는데, 특히 재즈를 좋아해.</p>


<p>어떻게든 프로젝트 끝냈어.</p>


<p>프로젝트가 어려웠지만, 끝냈어.</p>


<p>원래는 해외여행 갈 계획이었는데, 대신 집에 있기로 했어.</p>


<p>건강에 안 좋은 거 알지만, 어쩔 수 없어.</p>


<p>150만원이 달러로 얼마야?</p>


<p>카페에서 전 애인을 만났을 때 어색했어.</p>


<p>그 영화 보는 건 시간 낭비였어.</p>


<p>그 비싼 가방 사는 건 돈 낭비였어.</p>


<p>내가 너라면, 매니저한테 말할 거야.</p>


<p>그런데, 장소가 어디였지?</p>


<p>어제 소개팅 갈 예정이었는데 취소됐어.</p>


<p>결국 시험에 늦었어.</p>


<p>빨리 끝내자.</p>


<p>네가 자고 있을 거라 생각했어.</p>


<p>다이어트 중이라서 살 빼려고 해.</p>


<p>지난 2주 동안 살이 많이 쪘어.</p>


<p>넷플릭스 시리즈에서 나온 이 밈이 소셜미디어에서 바이럴 됐어. (대박났어)</p>


<p>말도 안 돼! (안 믿어!)</p>


<p>보통 여자애들은 달리기에서 남자애들을 따라가지 못해.</p>


<p>행사에 더 일찍 왔어야 했는데! 근데 교통체증이 심했어.</p>


<p>우리는 서로 그렇게 잘 맞지 않아.</p>


<p>우리 사이에 잘 안 될 것 같아.</p>


<p>그게 정말 필요해?</p>


<p>오늘 당직이야 (야간 근무).</p>


<p>이게 우리가 어제 산 것보다 두 배 비싸.</p>


<p>우리 그냥 안 가면 안 돼?</p>


<p>아무도 왜인지 몰라.</p>


<p>걔가 떠난 줄도 몰랐어.</p>


<p>왜 그런 거야?</p>


<p>그게 이거랑 무슨 상관이야?</p>


<p>너한테 부담 주기 싫어.</p>


<p>너 생각에는 어떤 게 제일 좋아?</p>


<p>좀 삼천포로 빠지는데...</p>


<p>10명 중 9명은 그렇게 할 거야.</p>


<p>다시 생각해보니, 그 가방 절대 사지 말았어야 했어.</p>


<p>나 '프렌즈' 드라마에 완전 빠졌어.</p>


<p>사업은 어떻게 돼가?</p>


<p>그건 너랑 관련 없어</p>
<p>너랑 아무 상관 없어.</p>


<p>분위기 파악해</p>
<p>조심해서 말해.</p>


<p>짧게 방문해도 항상 밥값 내야 해.</p>


<p>나 얘기는 됐고, 너희 얘기 좀 해봐.</p>


<p>모니터 암이 뭔지 알아?</p>


<p>네 일만 잘하면 괜찮아.</p>


<p>걱정 마, 내가 먼저 연락할게.</p>


<p>가야 할 것 같은 부담감이 있었어.</p>


<p>흥미롭게도, 우리 셰프가 운영하는 펜션을 예약했어.</p>


<p>나이 들수록</p>
<p>다시 생각해보고 있어.</p>


<p>나 FOMO야 (놓치는 것에 대한 두려움)</p>


<p>우리가 이걸 처음부터 만들었어.</p>


<p>걔는 정말 신사야.</p>


<p>그녀는 완벽주의자야.</p>


<p>더 편하게 말할 수 있게 되고 싶어.</p>


<p>그건 좀 삼천포로 빠졌어</p>
<p>주제에서 벗어났어</p>
<p>우린 좀 딴길로 샜어.</p>


<h3>어휘</h3>


<p>협상하다</p>
<p>재무 감사</p>
<p>동시에</p>
<p>주식과 채권에 투자하다</p>


<p>의심스러운</p>
<p>자극하다</p>
<p>유능한 직원</p>
<p>시간을 잘 지키는</p>


<p>총각 파티</p>
<p>브라이덜 샤워</p>
<p>스트리퍼</p>
<p>필수적인</p>
<p>망설이고 있어</p>


<p>숙박 시설</p>
<p>야심 찬</p>
<p>골드 디거</p>
<p>일생에 한 번뿐인 기회</p>


<p>세심하고 배려하는</p>
<p>증명하다</p>
<p>승인</p>
<p>선거에 투표하다</p>


<p>이용하다</p>
<p>일반적으로</p>
<p>마지막 순간에</p>
<p>일부러</p>


<p>스트레스 받은</p>
<p>압도된</p>
<p>의욕 있는</p>
<p>연기하다</p>


<p>(계획을) 고수하다</p>
<p>돋보이다</p>
<p>공감할 수 있어</p>


<p>~처럼 보이다</p>
<p>연락하며 지내다</p>
<p>조만간</p>
<p>다시 생각해보면</p>


<p>아이디어를 떠올리다</p>
<p>처리하다</p>
<p>실수로 (우연히)</p>
`,
  "Intermediate: Actual Level Test": `
 <h1>Grading Rubric</h1>
<p>Must get over 65% correct + major bulk answers all correct</p>
<p>Forgive: a, the, plural s, and sentences that mean the same thing and sound natural</p>
<p>Will fail the question if it takes too long for student to respond</p>
<p>The test will keep being updated so please adjust your mock tests according to this page</p>
<p>Rules: you can share the actual questions with the students . You can even share the link for the test.</p>
<p>I will try to finish the test in 45 minutes and give feedback for 15 minutes.</p>
<p>Take notes via google docs</p>
<p>Key: * = small mistake (will forgive) / ** = this mistake will affect grade / *** = big mistake (should not appear at this level)</p>
<p>How students usually fail</p>
<p>Simply not memorizing the expressions</p>
<p>if your student took class properly, these sentences shouldn’t be too difficult to memorize. They should already know 80% of the sentence but will make small mistakes when you test them. Use the pressure from the exam to do make sure students know these expressions for sure.</p>
<p>You already know what will come out on the test. If the student still gets it wrong, they just didn’t study or are not qualified to take this test.</p>
<p>The Teacher didn’t help students make long form scripts</p>
<p>There are no curveballs with the long form speaking questions. Help students write responses that you know will pass and make sure to buff out any small grammar mistakes through mock tests.</p>
<p>You didn’t take enough mock tests</p>
<p>you think they know, they think they know, but sometimes they still get it wrong regardless</p>
<p>make sure you start mock testing at least 1 month before the exam.</p>
<p>me personally I just put everything they get wrong into quizlet > and then do the mock test again.</p>
<p>(no need to review everything via quizlet. just review via another mock test)</p>
<p>record the mock tests and send it to them</p>
<p>If your students don’t study, just mock test them. If they still don’t study have them fail the test.</p>
<p>Have students write out the long form responses for homework instead of the diary to save prep time.</p>
<p>of course you may need to edit and upgrade their answers to help them pass</p>
<h2>The Test Starts Here</h2>
<h2>Timer: 0 minute mark</h2>
<h3>Basic Questions (click to open up)</h3>
<p>Date: What is the date today? > must respond & ask the right questions</p>
<p>오늘 날짜가 어떻게 되나요?</p>
<p>오늘 무슨 요일인가요?</p>
<p>시간 & 날짜 (NEW)</p>
<p>7월 20일 / 11월 30일 / 2월 12일 / 4월 15일</p>
<p>지금 몇시인지 아시나요? > 지금 12시 반이에요 (현재 시간으로)</p>
<p>학원 오는데 얼마나 걸리나요? > 한 30분 정도 걸려요 (it takes about half an hour)</p>
<p>미국 언제 갈꺼야? > 8월 7일쯤 갈거야. (i’m gonna go on august 7th)</p>
<p>Greet the teacher: can you say hi to me in 3 different ways? (greetings that are in the “easy” level in the textbook will not count)</p>
<p>how is it going? > it’s going well</p>
<p>how are you doing? > I’m doing well</p>
<p>what’s going on? > nothing special</p>
<p>what’s up? > nothing much</p>
<p>how is everything? > everything is good</p>
<p>is everything going well? > yeah, everything’s good</p>
<p>What’s on your mind? > nothing much (there’s nothing on my mind)</p>
<p>It’s been a while! Long time no see > Yeha it’s been a while! How are you?</p>
<p>Let’s catch up sometime!</p>
<h2>Timer: 5 minute mark</h2>
<h3>Common Questions (ask all)</h3>
<p>Hi XX, long time no see, can you introduce yourself? [talking about oneself] [Must memorize an upgraded version]</p>
<p>What are your hobbies nowadays? What are you into? Tell me in detail (Or: tell me about your hobbies in more detail!) [Must memorize upgraded version]</p>
<p>what do you look forward to in your day?</p>
<p>What do you do? (what is your job?) Tell me more about your job & company. [Must memorize upgraded version] (skip if it was mentioned in detail already)</p>
<p>Or : tell me about being a student. How is it? do you wanna grow up faster? (For students)</p>
<p>(There may be follow up questions to test their basic grammar and speed)</p>
<h2>Timer: 10 minute mark</h2>
<h3>Work questions (ask at least 3)</h3>
<p>there may be follow up questions</p>
<p>I am looking for any grammar mistakes, the use of advanced grammar, intermediate vocabulary, speed, natural flow</p>
<p>Advanced grammar = Have pp, could, should, relative pronouns, verbal nouns, might</p>
<p>Tell me about a typical day at work</p>
<p>Tell me about your most recent project</p>
<p>What was your previous job?</p>
<p>Why are you taking a break from work?</p>
<p>How are you enjoying taking a break from school / work?</p>
<p>How is being a housewife treating you? (student / an employee)</p>
<p>do you like your company or school? what about your major?</p>
<p>tell me about your team and position?</p>
<p>what do you plan to do for work in your future</p>
<p>do you like school? how is it different from other schools?</p>
<p>do you like your homeroom class?</p>
<p>do you like your homeroom teacher?</p>
<p>are there any professors / managers / coworkers that you like?</p>
<h2>Timer: 15 minute mark</h2>
<h3>Storytelling (ask at least 2) (click to open up)</h3>
<p>Must use advanced grammar</p>
<p>Good storytelling = incorporating characters, dialogue, and an entertaining flow. (practice makes perfect)</p>
<p>Tell me about something unexpected that happened recently</p>
<p>Tell me about the most memorable fight or argument you had with someone that you know</p>
<p>Tell me some office gossip. (maybe someone you dislike at work)</p>
<p>Tell me about a situation that annoyed you at work</p>
<p>Tell me about how your kids upset you or made you laugh</p>
<h2>Timer: 20 minute mark</h2>
<h3>Grammar: Verbal Nouns and Relative Pronouns (ask at least 7) (click to open up)</h3>
<p>저 여자가 [제가 어제 만난 여자]에요.</p>
<p>[제가 좋아했던 그 여자]가 이사 갔어요.</p>
<p>[제가 만난 그 남자]는 코미디언이었어요.</p>
<p>제가 [당신이 만난 사람]을 봤어요.</p>
<p>[제가 어제 뭘 했는지] 기억이 안 나요.</p>
<p>[그녀가 이게 예쁘다고] 말했어요.</p>
<p>[제가 어릴 때], 저는 아팠어요.</p>
<p>제가 [왜 그녀가 화났는지] 모르겠어요.</p>
<p>제가 [당신이 어디 있는지] 알아요.</p>
<p>그게 [제가 우유를 못 마시는 이유]에요.</p>
<p>제가 [당신이 거짓말한 걸] 알아요.</p>
<p>[제가 예쁘지 않다고] 생각했어요.</p>
<p>제가 [1000원짜리 물]을 샀어요.</p>
<p>[제가 좋아하는 음식]은 피자예요.</p>
<p>[제가 일하는 회사]는 부산에 있어요.</p>
<p>제가 좋아하는 장면은 [주인공이 악당과 싸우는 장면]이에요.</p>
<p>제가 좋아하는 [여자를 만났어요].</p>
<p>[그게 바로 당신을 좋아하는 이유예요].</p>
<p>제가 [포레스트 검프라는 영화]를 봤어요.</p>
<p>저는 [유명한 케이팝 보이그룹인 BTS]를 좋아해요.</p>
<p>나는 그가 내 이름을 기억하는지 궁금해.</p>
<p>나는 네가 여행을 즐겼기를 바라.</p>
<p>그녀는 왜 늦었는지 설명했어.</p>
<p>내가 이걸 제시간에 끝낼 수 있을지 확신이 안 서.</p>
<p>나는 오늘이 그녀의 생일이라는 걸 잊었어.</p>
<p>나는 네가 내일 쉬는 날인 걸 알기 때문에 계획을 세웠어.</p>
<p>그가 쓴 보고서가 이 프로젝트의 핵심 자료야.</p>
<p>그가 언급했던 프로젝트가 드디어 시작됐어.</p>
<p>내가 다니는 헬스장은 24시간 운영해.</p>
<p>그녀가 요리한 음식이 오늘의 메인 요리야.</p>
<p>내가 매일 이용하는 지하철역이 이번 주에 공사 중이야.</p>
<h2>Timer: 25 minute mark</h2>
<p>Choose 3 of 5 topics to talk about (5 min each)</p>
<h3>Movies (ask at least 2) (must use multiple relative pronouns & verbal nouns ) (click to open up)</h3>
<p>(or TV shows, Anime, webtoons, books, entertainment shows)</p>
<p>What movie did you watch recently?</p>
<p>What was the story about in detail?</p>
<p>What is your all time favorite movie?</p>
<p>What was the story about in detail?</p>
<p>Why do you like this movie so much?</p>
<p>Ask me 3 questions about my movie taste and recommend a movie for me and explain why you think I would like it</p>
<p>Tell me about your favorite actor or actress and why you like them. What did they come out in?</p>
<p>what TV program did you watch when you were a kid? what is it about?</p>
<h3>Talking to a foreigner (click to open up)</h3>
<p>Let’s have a conversation. Please ask me about my childhood, where I grew up, and how I came to korea. (refer to the expressions below)</p>
<p>Make the student ask you about 5~10 questions about yourself and your foreign background</p>
<p>Must use at least 5 of the following questions</p>
<p>The flow of questioning must be natural</p>
<p>For David</p>
<p>Where did you grow up?</p>
<p>Where in the states did you live?</p>
<p>What state are you from?</p>
<p>Do you miss living in america?</p>
<p>Are you planning to go back anytime soon?</p>
<p>Where do you like living better? Korea or the US?</p>
<p>How long has it been since you lived in the US?</p>
<p>What’s the best part about living in korea? (being back in korea)</p>
<p>Do you speak any other lanugages?</p>
<p>Did you live anywhere else other than the US? (any other countries)</p>
<p>Where did you go to school?</p>
<p>For other teachers (try to memorize this one as well)</p>
<p>Are you teaching full time?</p>
<p>Where did you learn your english? (how to speak english)</p>
<p>how long did you live in ~</p>
<p>How long has it been since you came back to korea?</p>
<p>what brings you back to korea?</p>
<p>Are you staying for good? or are you just visiting for a while?</p>
<p>Where do you prefer living?</p>
<p>What do you miss about your home country?</p>
<p>Have you traveled in other countries as well?</p>
<p>Did you get to travel a lot in korea?</p>
<p>What’s the best part about living in Germany?</p>
<p>How is korea treating you?</p>
<p>What was your job back in California?</p>
<p>Are there any places you recommend to visit back in France?</p>
<p>How many languages do you speak?</p>
<p>How is korea compared to Europe?</p>
<p>How’s the food treating you?</p>
<h3>Drinking (ask at least 2)</h3>
<p>All answers must incorporate storytelling & advanced grammar</p>
<p>When is the last time that you drank?</p>
<p>Do you drink often?</p>
<p>Tell me about a embarrassing drinking experience (must explain situation well / express why it was embarrassing)</p>
<p>Recommend a pub and explain why you like it</p>
<p>what can I order there? What do they serve?</p>
<p>Ask me 5 drinking questions & have a small conversation with me regarding the topic</p>
<p>The questions cannot all be too easy and must connect like a conversation</p>
<h3>Dating (ask at least 2)</h3>
<p>All answers must incorporate storytelling & advanced grammar</p>
<p>Tell me about your most recent dating experience</p>
<p>Why didn’t it work out? / How is the relationship going?</p>
<p>What are your thoughts about marriage and kids?</p>
<p>What is your ideal type? Does that person match your ideal type?</p>
<p>Do you have a crush on someone right now? what kind of person are they?</p>
<p>Tell me about your ex (if it’s okay to ask)</p>
<p>Ask me 5 dating questions & have a small conversation with me regarding the topic</p>
<p>The questions cannot all be too easy and must connect like a conversation</p>
<h3>Being sick (ask at least 2)</h3>
<p>All answers must incorporate storytelling & advanced grammar</p>
<p>Tell me about the last time you were sick. How were you sick and how painful was it? How did you recover?</p>
<p>Tell me about the last time you hurt yourself physically. What happened and how painful was it? How did you deal with it?</p>
<p>Are you stressed nowadays? What are you stressed about? How are you dealing with it?</p>
<p>When is the last time that you went to the hospital?</p>
<p>Ask me 5 questions about being sick or hurt and have a small conversation with me regarding the topic</p>
<p>The questions cannot all be too easy and must connect like a conversation</p>
<h2>Timer : 40 minute mark</h2>
<h2>Intermediate Pillar expressions (ask 20)</h2>
<p>가능하면 헬스장에 갈 수도 있어.</p>
<p>이 영화는 해리 포터와 비슷해.</p>
<p>그게 우리가 지난번에 본 거 아니야?</p>
<p>그 영화는 우리가 지난주에 본 거야.</p>
<p>오랜만에 옛 친구와 안부를 나눴어. (근황토크)</p>
<p>한국에서 가장 유명한 레스토랑 중 하나에서 식사했어.</p>
<p>날씨에 따라 달라.</p>
<p>나는 모든 종류의 음악을 좋아하지만, 특히 재즈를 사랑해.</p>
<p>어떻게든 프로젝트를 끝냈어.</p>
<p>프로젝트가 어려웠지만, 그래도 끝냈어.</p>
<p>원래는 해외여행을 계획했지만, 대신 집에 있기로 결정했어.</p>
<p>보통 나는 매일 아침 7시에 일어나.</p>
<p>결론적으로 2가지</p>
<p>결국에는 2가지</p>
<p>드디어 2가지</p>
<p>결과로서</p>
<p>내가 파티에 가지 않은 이유는 일 때문에 너무 지쳤기 때문이야.</p>
<p>내가 고향을 마지막으로 방문한 것은 아주 오래 전이야.</p>
<p>버스를 놓쳤어. 그래서 늦었어.</p>
<p>등산은 힘들었지만, 그만한 가치가 있었어.</p>
<p>개인적으로, 나는 이것이 최선의 선택이라고 생각해.</p>
<p>건강에 좋지 않다는 걸 알지만, 어쩔 수 없어.</p>
<p>150만원은 달러로 얼마야?</p>
<p>그는 나에게 30만원을 빚졌어.</p>
<p>대화가 이상해졌어.</p>
<p>카페에서 전 애인을 만났을 때 어색했어.</p>
<p>이 프로젝트를 통해 그녀를 잘 알게 됐어. (close 아님)</p>
<p>우리는 아직 서로를 알아가는 중이야.</p>
<p>그 영화를 보는 것은 시간 낭비였어.</p>
<p>그 비싼 가방을 사는 것은 돈 낭비였어.</p>
<p>내가 너라면, 매니저와 얘기할 거야.</p>
<p>이것 좀 도와줄 수 있을까?</p>
<p>결국 그 행사에 자원봉사를 하게 됐어.</p>
<p>왠지 그 노래에 대해 계속 생각이 났어.</p>
<p>그녀는 내내 조용했어.</p>
<p>그런데, 장소가 어디였지?</p>
<p>어쩔 수 없어.</p>
<p>어제 소개팅을 가기로 했는데 취소됐어.</p>
<p>그렇게 했어야 했는데.</p>
<p>내가 너라면 그렇게 했을 거야.</p>
<p>결국 시험에 늦었어.</p>
<p>중간고사를 거의 다 끝냈어.</p>
<p>우리 아이들이 잘 어울려서 기뻐.</p>
<p>내가 너라면, 나도 긴장됐을 거야.</p>
<p>왠지 잠을 잘 수 없었어.</p>
<p>대략 5만원 정도 들었어.</p>
<p>빨리 끝내자.</p>
<p>그만한 가치가 있었어! / 그만한 가치가 없었어.</p>
<p>네가 자고 있을 거라고 생각했어.</p>
<p>다이어트 중이라서 체중을 줄이려고 노력 중이야.</p>
<p>지난 2주 동안 체중이 많이 늘었어.</p>
<p>넷플릭스 시리즈의 이 밈이 소셜 미디어에서 바이럴했어.</p>
<p>난 그걸 믿지 않아!</p>
<p>일반적으로, 달리기에서 여자들은 남자들을 따라가지 못해.</p>
<p>행사에 더 일찍 왔어야 했는데! 하지만 교통이 혼잡했어.</p>
<p>낙관적인 / 비관적인</p>
<p>응원할게! / 널 응원해!</p>
<p>얼마나 오래 밖에 있었어?</p>
<p>우리는 서로 그다지 잘 맞지 않아.</p>
<p>우리 사이에 잘 안 될 것 같아.</p>
<p>그게 정말 필요해?</p>
<p>오늘 당직이야 (야간 근무)</p>
<p>어제 우리가 산 것보다 두 배나 비싸 (두 배의 가격)</p>
<p>그냥 안 가면 안 돼?</p>
<p>어떻게 될지 두고 보자!</p>
<p>가야 한다는 압박감을 느꼈어 / 나한테 압박 주지 마!</p>
<p>아무도 그 이유를 몰라.</p>
<p>그가 떠났다는 것도 몰랐어.</p>
<p>왜 그런 거야?</p>
<p>그게 무슨 상관이야?</p>
<p>너에게 부담을 주고 싶지 않아.</p>
<p>그가 안타까웠어.</p>
<p>너의 의견으로는 어떤 게 제일 좋아?</p>
<p>그 돈을 너한테 쓰는 게 낫겠어.</p>
<p>술 마시러 가는 것보다 운동하러 가는 게 낫겠어.</p>
<p>당황한 / 당황스러운</p>
<p>좀 주제에서 벗어나지만...</p>
<p>10명 중 9명은 그렇게 할 거야.</p>
<p>다시 생각해보니, 그 가방을 사지 말았어야 했어.</p>
<p>나는 "프렌즈" TV 쇼에 완전히 빠졌어.</p>
<p>말 끊어서 미안해.</p>
<p>약 먹는 걸 잊었어.</p>
<p>사업은 어떻게 돼가?</p>
<p>부럽다 / 네가 부러워.</p>
<p>내가 말했는지 모르겠네.</p>
<p>너와는 관련이 없어 / 너와는 아무 상관이 없어.</p>
<p>지난 2개월 동안</p>
<p>분위기를 읽어 / 조심스럽게 행동해</p>
<p>짧은 방문인데도 항상 내가 음식값을 내야 해.</p>
<p>나 얘기는 그만하고, 너희 얘기 좀 해봐.</p>
<p>모니터 암이 뭔지 알아?</p>
<p>정신적 붕괴가 왔어.</p>
<p>나 자신에게 매우 실망했어.</p>
<p>네가 나를 사랑하는 한</p>
<p>네가 일만 하면 돼.</p>
<p>내가 아는 바로는</p>
<p>걱정 마, 내가 먼저 연락할게.</p>
<p>최악의 상황이 뭐야?</p>
<p>신기하게도,</p>
<p>나이가 먹을수록 (2가지)</p>
<p>시간이 갈수록</p>
<p>다시 고민중이야</p>
<p>나 FOMO 있어</p>
<p>이거 처음부터 만들었어</p>
<p>너무 신사다 (예의바르다)</p>
<p>그녀는 완벽주의자야</p>
<p>너 편하게 말할 수 있었으면 좋겠어</p>
<p>다른 이야기긴 한데 (3가지)</p>
<p>밤샜다 (2가지)</p>
<p>해볼만해 (2가지)</p>
<h2>Answer Key</h2>
<h2>Intermediate Pillar expressions (ask 20)</h2>
<p>I might go to the gym later if I can.</p>
<p>This movie is similar to Harry potter</p>
<p>isn’t that what we watched last time?</p>
<p>The movie is one that we watched last week.</p>
<p>I caught up with an old friend for the first time in a while.</p>
<p>I dined at one of the most famous restaurants in Korea.</p>
<p>It depends on the weather.</p>
<p>I like all kinds of music, but I specifically love jazz.</p>
<p>I finished the project somehow</p>
<p>even though the project was difficult, I finished it (even if)</p>
<p>Originally, I planned to travel abroad, but I decided to stay home instead.</p>
<p>Normally, I wake up at 7 AM every day.</p>
<p>All in all / In conclusion</p>
<p>eventually / In the end</p>
<p>finally / at last</p>
<p>As a result</p>
<p>The reason that I didn’t go to the party was because I was too drained from work.</p>
<p>The last time that I visited my hometown was ages ago.</p>
<p>I missed the bus. That’s why I was late.</p>
<p>The hike was tough, but it was worth it.</p>
<p>Personally, I think this is the best option.</p>
<p>I know it’s unhealthy, but I can’t help it.</p>
<p>How much is 1,500,000 won in dollars?</p>
<p>He owes me 300,000 won.</p>
<p>The conversation got weird.</p>
<p>It felt awkward when I met my ex at the café.</p>
<p>I got to know her well through this project.</p>
<p>we’re still getting to know each other</p>
<p>Watching that movie was a waste of time.</p>
<p>Buying that expensive bag was a waste of money.</p>
<p>If I were you, I would talk to the manager.</p>
<p>Would you mind helping me with this?</p>
<p>I ended up volunteering for the event.</p>
<p>For some reason, I couldn’t stop thinking about that song.</p>
<p>She was quiet for the whole time.</p>
<p>By the way, where is the venue again?</p>
<p>I can’t help it</p>
<p>I was supposed to go on a blind date yesterday but it got canceled</p>
<p>I should’ve {~했었어야 했다}</p>
<p>I would’ve {나라면 ~를 했을 것이다}</p>
<p>I ended up being late to the test</p>
<p>I’m pretty much done with my midterms</p>
<p>I’m glad that our kids got along</p>
<p>if I were you, I would be nervous too</p>
<p>I couldn’t sleep for some reason</p>
<p>it cost roughly 50,000won</p>
<p>let’s get it over with</p>
<p>it was worth it! / it wasn’t worth it</p>
<p>I figured that you were sleeping</p>
<p>I’m trying to lose weight because I’m on a diet.</p>
<p>I gained a lot of weight over the last 2 weeks.</p>
<p>this meme from a netflix series went viral on social media. (it blew up)</p>
<p>I don’t buy it!</p>
<p>generally, girls can’t keep up with guys when running</p>
<p>I should’ve come to the event earlier! but the traffic was heavy.</p>
<p>optimistic / pessimistic</p>
<p>I’m cheering for you! / I’m rooting for you!</p>
<p>how long did you stay out?</p>
<p>we’re not that compatible with each other</p>
<p>it’s not gonna work out between us</p>
<p>is that even neccesary?</p>
<p>I’m on duty today (the night shift)</p>
<p>it’s twice as expensive as the one we bought yesterday (twice the price)</p>
<p>why can’t we just not go?</p>
<p>we’ll see how it goes!</p>
<p>I felt pressured to go / stop pressuring me!</p>
<p>no one knows why</p>
<p>I didn’t even know that he left</p>
<p>why is that the case?</p>
<p>what does that have to do with anything?</p>
<p>I don’t want to burden you</p>
<p>I felt bad for him</p>
<p>In your opinion, which one is the best?</p>
<p>I would rather spend that money on you</p>
<p>I would rather go work out than go drink</p>
<p>embarrassed / embarrassing</p>
<p>this is kind of a tangent but ..</p>
<p>9 out of 10 people would do that</p>
<p>on second thought, I should’ve never bought that bag</p>
<p>I’m totally obsessed with the TV show “friends”</p>
<p>sorry to cut you off</p>
<p>I forgot to take my medicine</p>
<p>how is your business going?</p>
<p>I'm jealous / I envy you</p>
<p>I'm not sure if I told you</p>
<p>it’s not related with / it doesn’t have anything to do with you</p>
<p>for the last 2 months</p>
<p>read the room / walk on eggshells</p>
<p>I always have to pay for food even though it’s a short visit.</p>
<p>enough about me, tell me about you guys</p>
<p>do you know what a monitor arm is?</p>
<p>I had a mental breakdown</p>
<p>I was very disappointed in myself</p>
<p>as long as you love me</p>
<p>as long as you do your work, it’s all good</p>
<p>from what I know</p>
<p>don’t worry, I’ll reach out first</p>
<p>what’s the worst case scenario?</p>
<p>interestingly enough,</p>
<p>As I get older / the older I get</p>
<p>As time goes by</p>
<p>I’m having second thoughts</p>
<p>I have FOMO (fear of missing out)</p>
<p>we made this from scratch</p>
<p>he’s such a gentleman</p>
<p>she’s a perfectionist</p>
<p>I want to be able to say it more comfortably</p>
<p>that was a tangent / that was off topic / we sidetracked a bit</p>
<p>I pulled an all nighter / I stayed up all night</p>
<p>it's worth a try</p>
<p>Pillar Vocab (ask 10)</p>
<p>보아하니 / 듣자 하니</p>
<p>엄밀히 말하면 / 기술적으로</p>
<p>협상하다</p>
<p>정착하다 / 자리 잡다</p>
<p>재무 감사</p>
<p>은퇴하다</p>
<p>동시에</p>
<p>까다로운</p>
<p>주식과 채권에 투자하다</p>
<p>고려하다 / 생각하다</p>
<p>~을 언급하다 / ~을 참조하다</p>
<p>~에 관하여 / ~와 관련하여</p>
<p>회의적인</p>
<p>피해망상적인 / 과민한</p>
<p>자극하다</p>
<p>유능한 직원</p>
<p>시간을 잘 지키는 / 시간 엄수하는</p>
<p>정치</p>
<p>욕설 / 욕하기</p>
<p>총각 파티 / 신부 파티 (결혼 전 파티)</p>
<p>스트리퍼들 (춤추는 사람들)</p>
<p>장소 / 개최지</p>
<p>의무적인 / 필수의</p>
<p>무언가가 유행하고 있다</p>
<p>망설이고 있어요</p>
<p>편리한</p>
<p>직설적인 / 솔직한</p>
<p>숙소 / 숙박 시설</p>
<p>다과 / 음료수들</p>
<p>야망 있는 / 포부가 큰</p>
<p>느긋한 / 여유로운 (혹은 "진정해"라는 표현으로도 사용)</p>
<p>기진맥진한 / 매우 지친</p>
<p>꽃뱀들 (돈만 노리는 사람들)</p>
<p>일생에 한 번뿐인 기회</p>
<p>귀걸이 / 목걸이 / 팔찌들</p>
<p>치아 교정기 (브레이스)</p>
<p>치실 (플로스)</p>
<p>섬세하고 배려심 있는</p>
<p>존중하는 / 예의 있는</p>
<p>오글거리는 / 민망한</p>
<p>증명하다 / 승인(허가)하다</p>
<p>선거에서 투표하다</p>
<p>장례식</p>
<p>공통 친구들</p>
<p>~을 이용하다 (부정적 뉘앙스 포함 가능)</p>
<p>병가를 내다 (아프다고 연락하다)</p>
<p>집착하는 / 푹 빠진</p>
<p>첫째로 / 둘째로</p>
<p>직설적인 / 솔직한</p>
<p>Vocab (ask 10) > make fun phrases chapter</p>
<p>apparently,</p>
<p>technically,</p>
<p>negotiate</p>
<p>settle down</p>
<p>financial audit</p>
<p>retire</p>
<p>simultaneously</p>
<p>picky</p>
<p>invest in stocks and bonds</p>
<p>consider</p>
<p>refer to</p>
<p>regarding ~</p>
<p>skeptical</p>
<p>paranoid(delete?)</p>
<p>stimulate</p>
<p>a competent employee</p>
<p>punctual</p>
<p>politics</p>
<p>swearing / cussing / cursing</p>
<p>bachelor party / bridal shower</p>
<p>strippers</p>
<p>venue</p>
<p>mandatory</p>
<p>something is trending</p>
<p>i’m hesitating</p>
<p>convenient</p>
<p>straightforward / direct</p>
<p>accommodation</p>
<p>refreshments / beverages</p>
<p>ambitious</p>
<p>chill</p>
<p>exhausted</p>
<p>gold diggers</p>
<p>once in a lifetime opportunity</p>
<p>earrings / necklaces / bracelets</p>
<p>braces</p>
<p>floss</p>
<p>sensitive and caring</p>
<p>respectful</p>
<p>cringy</p>
<p>prove / approval</p>
<p>vote for the election</p>
<p>funeral</p>
<p>mutual friends</p>
<p>take advantage of</p>
<p>call in sick</p>
<p>obsessed</p>
<p>first of all / second of all</p>
<p>straightforward</p>
<p>End Timer: 45 minute mark (15 minutes left for feedback)</p>
`,
"Business: In Depth Business Conversation Topic List": `
  <h1>💼 Business Conversation Topics Guide</h1>

  <p>Use examples to explain, but keep answers under 15 sentences for memorization.<br/>
  Choose topics based on the student’s background. Feel free to adjust.</p>

  <ul>
    <li>Tell me about the company that you work at in detail.</li>
    <li>Tell me about your specific role at your company in detail.</li>
    <li>Tell me about a typical day at work in chronological order.</li>
    <li>Tell me about your team and department. What is your team in charge of?</li>
    <li>Are you satisfied with your job? Why or why not?</li>
    <li>What was your previous job? Why did you change jobs?</li>
    <li>What is your plan for the next 10 years?</li>
    <li>When do you usually get stressed? How do you handle stress?</li>
    <li>What motivates you to work harder or be better?</li>
    <li>What are your strengths and weaknesses? Give examples.</li>
    <li>Are there any coworkers you dislike? Spill some office gossip.</li>
    <li>How would your colleagues describe you?</li>
    <li>Are there any coworkers you like? Why do you admire them?</li>
    <li>What was the biggest challenge you’ve faced at work, and how did you overcome it?</li>
    <li>What skills have you developed the most through your job, and how?</li>
    <li>Have you ever made a mistake at work? What happened and how did you handle it?</li>
    <li>What’s your work-life balance like? Do you think it’s healthy? Why or why not?</li>
    <li>How do you stay productive or focused during long or difficult workdays?</li>
    <li>Tell me about some unique culture in your company.</li>
    <li>If you could change one thing about your current job, what would it be and why?</li>
  </ul>
`,
"Business: Memorable Projects":`
   <h2>📚 Business Template 5</h2>

   <p><strong>Use examples to explain but keep the answers under 15 sentences to be able to memorize</strong></p>

   <p><strong>Tell me about your most memorable projects that shaped your career. Tell me in detail with examples about these projects.</strong></p>

   <ol>
     <li>Project 1 Title:</li>
     <li>Project 2 Title:</li>
     <li>Project 3 Title:</li>
   </ol>
 `

};


export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const student = searchParams.get("student_name");
  const title = searchParams.get("title");

  if (!student || !title) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  try {
    const result = await getTestData(student, title);

    // 🛠️ FIX HERE: use result.text instead of result.html
    if (result?.text) {
      return NextResponse.json({ html: result.text }); // <- important
    }

    const fallback = templates[title];
    if (fallback) {
      return NextResponse.json({ html: fallback });
    }

    return NextResponse.json({ error: "No content found" }, { status: 404 });
  } catch (err) {
    console.error("GET /api/test error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


export async function POST(req: Request) {
  const body = await req.json();
  const { student_name, title, text } = body;
  console.log(body)
  if (!student_name || !title || !text) {
    return NextResponse.json({ error: 'Missing body data' }, { status: 400 });
  }

  const result = await saveOrUpdateTestData(student_name, title, text);
  return NextResponse.json(result);
}

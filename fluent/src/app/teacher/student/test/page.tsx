'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';



type NoteData = {
  student_name: string;
  title: string;
  text: string;
};



const templates: Record<string, string> = {
  'Beginner: Mock Test Prep Class 1': `
Date: 
Mock Test Class 1

Tip 1: Keep taking mock tests every class
Tip 2: Use the “collect bulk answers”, “filter grammar”, and “filter pillar expressions” while taking these mock tests. 
Tip 3: It will take some students 3 classes to prepare for the level test and some students over 16 classes. It depends on how seriously they memorize and review their flashcards. It’s a memorization test. Students must get 70% correct to pass. 

Part 1: 날짜

날짜 물어봐주시고 대답해주세요. 
요일 물어봐주시고 대답해주세요. 

Part 2: 인사

Please greet me in 3 different ways. Do not use easy greetings. 

Part 3: 자기소개
Long time no see, can you introduce yourself again? (bulk answer)

Part 4: 취미
Tell me more about your hobbies in detail (bulk answer)

Part 5: 직업
Can you tell me more about your job? (bulk answer)

Part 6: 과거형 대화 
What did you do today / before class / last weekend / yesterday? (freeform answer)

Part 7: 미래형 대화 
What are you going to do / after class / this weekend / on friday? (freeform answer)

Part 8: 3인칭 단수 대화
Tell me about your best friend (or a coworker) (bulk answer)

Part 9: 시간 & 날짜 (grammar memorization)
오늘 몇일인가요? 2월 12일 입니다.
생일이 언제인가요? 5월 31일 입니다.
7월 20일 / 11월 30일 / 2월 12일 / 4월 15일
무슨 요일인가요? > 오늘은 수요일이에요
지금 몇시인지 아시나요? > 지금 12시 반이에요
학원 오는데 얼마나 걸리나요? > 한 30분 정도 걸려요 (it takes about half an hour)
미국 언제 갈꺼야? 8월 7일쯤 갈거야.
아침 먹고 나서 2가지
퇴근 하고 나서 2가지
출근 하기 전에 2가지

Part 10: 과거형 / be 동사 / 일반동사 / 질문  (grammar memorization)
그녀는 행복하지 않았어.
얼마나 오래 영어를 가르쳤니?
어떤 영화 봤어?
그녀는 어떤 음식 좋아한데?
얼마나 자주 운동하니?
어떤 영화를 좋아하니?
어떤 게임을 했어?
프랑스 어디에서 살았어?
잘 잤어?
너의 가족은 어디에 살아?
아버님은 어떤 회사에서 일하셔?
가족과 같이 사니?
그녀는 학교에 가?
가족과 친하니?
그녀는 영어를 공부해?
그는 피자를 좋아해
그는 무슨 공부를 하니?
그녀는 매일 독서해
내 휴가는 11월 13일부터 12월 6일까지야.
나는 7월 7일에 출장이 있어.
8월에 계획이 있어?
일요일에 언제 집에 왔어?
지난 주말에 어디 갔어?

Part 11: 미래형  (grammar memorization)
내일 뭐할거니? (will & be going to V)
너 주말에 뭐할거야? (2가지 방법)
토요일에 나 친구 만나러 강남갈거야
우리 아마 저녁 먹고 수다 떨기 위해 카페갈거야
나 내일 미국으로 여행갈거야
나 오늘 수업 끝나고 집 가서 넷플릭스 볼거야
너는? 너는 오늘 수업 끝나고 뭐할거니?

Part 12: to 부정사 8개  (grammar memorization)
너 햄버거 먹고 싶니?
나는 미래에 경찰이 되기로 결정했어
나는 요즘 일찍 일어나려고 노력중이야
내 남동생이 울기 시작했어
너는 운동하는거 좋아하니?
퇴근하고 술 먹고 싶어
그녀는 집에 가서 그녀의 애들을 위해 요리해줘야해
그는 카페에 가기 위해 압구정에 가야해
저녁을 아내와 같이 먹고 싶었어.
아내는 늦게까지 일해야 했어.
다음 날 6시에 일어나야 해서 일찍 잤어.
저는 넷플릭스 보면서 치킨 먹는 것을 좋아해

Part 13: 위해의 2가지 to V / for N  (grammar memorization)
나는 친구를 만나기 위해 홍대에 갔어
나는 부모님을 뵙기 위해 일본에 갔어
나갈 준비를 했어. / 출근 준비를 했어. ( I got ready for work / I got ready to go out)
친구들을 만나러 홍대에 갔어.
수업을 위해 홍대에 왔어.
나 너를 위해 선물 샀어
나는 2년 동안 일 하러 일본에 가고 싶어 내 커리어를 위해

Part 14: 동안 3가지  (grammar memorization)
나는 아침을 먹는 동안 티비를 봤어
나는 휴가 동안 집에 있었어
3시간 동안 울었어
일 년 동안 영어 공부했어
방학 동안 나는 미국에 갔어
집에 있는 동안 유투브를 봤어
제가 술을 마시는 동안 비가 그쳤어요 *
공부를 하는 동안 배가 고파졌어요 *

Part 15: ing 4가지  (grammar memorization)
운동하는 것은 재미있어
요즘 저는 미국을 가기 위해 영어 공부를 하고 있어요
나는 피곤했지만 계속 일했어
나는 취했지만 계속 술을 마셨어
술은 몸에 안 좋아
나는 공부하는 것을 좋아해
나는 피곤했지만 계속 퀴즐렛을 공부했어
운동은 건강에 좋아
나는 요즘 여행하는 중이야
여행하는 것은 내 꿈이야
나는 어제 축구하는 동안 넘어졌어
그것은 피곤했어
TV 보는 것은 재미있어
나 뛸 거야
나 골프 잘쳐
나 요리 못해
난 그녀가 나한테 연락하길 기다리고 있어 (I’m waiting for her to contact me)
그는 졸려지기 시작했어 (I’m starting to get sleepy)
나 취할 예정이야 (I’m planning to get drunk)
나 라면 먹으러 갈려고 했는데, 시간이 부족했어. (I was planning to go eat ramen but I didn't have enough time)

Part 16:추가 필수 생활 표현  (grammar memorization)
주말에 재미있는거 했어?
일 외로 다른 것도 하셨나요?
일 외로는 특별한 것 없었습니다
아무것도 안했어
일하느라 바빴어.
친구랑 이야기하느라 바빴어.
어땠어? 재미있었어? > 네 재미있었어요!
홍대에 사람이 많아

Recommended Homework: 
Add all bulk answers + grammar mistakes to the flashcards
Teachers must filter out the ones that the students know for sure from the “filter grammar” & “filter pillar expressions” as well as updating the “collect bulk answers" tab with their most recent answers. 
From this point on it really depends on how good the student is at memorizing 
`,
  "Beginner: Mock Test Prep Class 2": `Date: 
Mock Test Class 2


Tip 1: Keep taking mock tests every class
Tip 2: Use the “collect bulk answers”, “filter grammar”, and “filter pillar expressions” while taking these mock tests. 
Tip 3: It will take some students 3 classes to prepare for the level test and some students over 16 classes. It depends on how seriously they memorize and review their flashcards. It’s a memorization test. Students must get 70% correct to pass. 



Part 17:비교급  (grammar memorization)
맥주가 소주보다 좋은데 와인이 최고야
맥주가 소주보다 비싼데 와인이 제일 비싸
제 방은 거의 고시원 만큼 작아요
미국은 캐나다 만큼 멀어요
교촌이 BBQ보다 맛있지만 푸라닥이 가장 맛있어요.
어제보다 기분이 나아요.
너 영어 많이 늘었다!
저 골프 많이 늘었어요.
데이빗이 아팠는데 좋아졌어요.
사라가 영어 실력이 좋아졌어요. 이제 거의 [데이비드만큼 잘해요].
데에빗이 사라보다 더 좋은 학생이지만 제프가 가장 좋은 학생이에요. *
조깅이 하이킹보다 더 힘들어요.*


Part 18:횟수  (grammar memorization)
저는 보통 가족을 한달에 4번 정도 봐요
저는 2주에 1번 정도 운동을 하는 것 같아요
주 3회 영어 공부하기 시작했어요.
저는 3달에 2번 정도 여행을 가요


Part 19:부정 질문  (grammar memorization)
너 돈 있지 않아?
너 안배고파?
너 안피곤해?
너 저녁 안먹었어?
너 여자친구 있지 않았어?
저 여자애 영어 하지 않아?
너 누나가 영국 살지 않아?
다시 해보지 그래요? (why don’t you try again?)
그냥 집에 있으면 안돼요? (can’t you just stay home?)
지금 집에 가는 것은 어떨까? (why don’t we go home now?)
이번에 내가 내는 것은 어때? (why don’t I pay this time?)
우리 그냥 내일 가면 안돼? (can’t we go tomorrow instead?)


Part 20: have pp 3가지  (grammar memorization)
발리 가본적 있어?
두리안 먹어본 적 있어?
해리포터 본 적 있어?
동방신기 들어본 적 있어?
응 나 먹어봤지!
아니 가본 적 없어
한번도 들어본 적 없어
한번도 가본 적 없어

Part 21: 가족
Tell me about your family in detail. How many members are there? What do they do?
Let’s have a short conversation. Please ask me at least 5 questions about my family during the conversation.
Family Question Bank (make sure they ask at least 5 questions when talking to you) (please have the questions connect naturally)
가족을 얼마나 자주 보나요?
가족에 대해 말해주세요
가족 인원이 몇명인가요?
형재 자매가 몇명인가요?
가족과 친한가요?
부모님에 대해 말해주세요 어떤 일을 하시나요?
남편은 어떤 회사에서 일하시나요?
아드님은 미래에 뭘 하실 계획인가요?
혼자 사세요? 아니면 부모님이랑 사시나요?
가족 중 누구랑 가장 친한가요?
형제자매랑 나이 차이가 어떻게 되나요?
몇살 더 많아요?
직업들이 어떻게 되시나요?


Part 22: 집 & 동네
What neighborhood do you live in? Tell me in detail. What do you like about your neighborhood? what are the characteristics?
Tell me about your house in detail.
tell me about your room?
Let’s have a short conversation. Please ask me at least 5 questions about my house and neighborhood.
House Question Bank (make sure they ask at least 5 questions when talking to you)
몇층에 사시나요?
아파트 사세요 집에 사세요?
저는 이 집에 3년동안 살았습니다
경치가 좋아요
집의 가장 마음에 드는 방이 어디에요?
집의 가장 마음에 드는 가구가 뭐에요?
집에 대해 가장 마음에 드는 점이 뭔가요?
어떤 동네에 사시나요?
이 지역에 얼마나 오래 살았어요?
그게 홈플러스 근처인가요?
이사하고 싶어요?
집에 만족하시나요?


Part 23: 기둥표현
Beginner Pillar Expressions (ask 20 out of the pool)
뭘 해야 할지 모르겠어.
그 셔츠를 어디서 사야 할지 모르겠어.
나 지금 시험 공부하고 있어.
나 처음으로 초밥 먹어봤어.
원하면 우리 영화 볼 수 있어.
밖에 비 오고 있어.
파리에 가고 싶어.
방금 점심 다 먹었어.
우리 산책했어.
이 앱 사용하는 방법 알려줄 수 있어?
어쨌든 다음 주제로 넘어가자.
숙제 끝내야 해.
오늘 좀 피곤해.
다쳤어. / 아파.
엄청 더워.
규칙을 따라야 해.
다음 주에 만나는 거 기대돼.
인도 음식 먹어본 적 있어?
돈 많이 벌고 싶어.
출근하는 길이야.
맛집 발견했어!
건강하게 먹어야 해.
오랜만에 옛 친구를 우연히 만났어.
벌써 늦었네, 집에 가자.
새로운 과제 하고 있어.
새 컴퓨터 설정해야 해.
"스페인어로 안녕"을 어떻게 말하는지 검색해봤어.
그녀는 그림을 정말 잘 그려.
외투 입어, 밖에 추워.
우유 다 떨어졌어.
약 받아와야 해.
도와줄 수 있어?
스페인어 배우는 것에 관심 있어.
비행기 한 시간 후에 출발해.
열쇠 찾고 있어.
나가기 전에 문 꼭 잠가.
새 차 마음에 들어.
방금 집에 왔어.
한국은 김치로 유명해.
그럴 가치 없어.
3일 연속으로.
말했듯이.
왕복 8시간 운전했어.
추천해?
누구한테 물어봐야 할지 모르겠어.
자신이 없어.
부산에서 해변 축제 하고 있었어.
사진 보여줄게!
돈 받았어?
요금이 가성비 좋았어.
벌금이 50만 원이었어.
오랜만에 중학교 친구들 만났어.
네가 원하는 대로 해도 돼.
구체적으로,
그녀가 나한테 교회 가라고 했어.
그녀에게 가방 사줬어.
그녀가 전화를 끊었어. / 내가 전화를 받았어.
커뮤니티 행사 기대돼.
아이들을 돌봐야 해.
고양이 돌보느라 바빴어.
블로그 써보는 게 좋을 것 같아.
마음에 들었으면 좋겠어.
잘됐으면 좋겠어.
살 안 쪘으면 좋겠어. (살 좀 빠졌으면 좋겠어.)
빨리 나았으면 좋겠어.
이번 겨울에 한국에 있을 거야.
그들이 나한테 음식 많이 사줬어.
요즘 와인에 푹 빠졌어.
실수하는 거 싫어.
퇴근하고 나서 올래?
안타깝게도,
다행히도,
나에 대해 말하자면,
운전할지 자전거 탈지 고민했어.
A를 할지 B를 할지.
이건 습관이 되면 안 될 것 같아.
미안해할 필요 없어. 괜찮아.
근데 장소가 어디였지?
그녀가 나한테 3만 원 빌렸어.
이 가방 7만 7천 원이야.
대화가 이상하게 흘러갔어.
결론적으로, 프로젝트는 성공했어.
요약하자면, 올해 목표를 달성했어.
전체적으로, 정말 좋은 경험이었어.
운동한 지 5년 됐어.
결국, 다 잘 해결됐어.
돈 낭비였어.
보통,
원래,
결국,
하루 종일,
그녀는 스페인에 안 가기로 했어.
내성적인 사람 / 외향적인 사람
“편리하다”를 영어로 어떻게 말해? > “convenient”이라고 해.
“convenient”가 무슨 뜻이야? > “편리하다”라는 뜻이야.
어제 쉬는 날이었어.
오늘 재미있게 보내길 바래!
지난번이랑 완전 똑같아.
그녀를 다시 만날지 고민 중이야.
회의 말고 다른 재미있는 일 했어?
다음 행사에 참석 못 해?
그거 무례한 거 아니야?
네가 원할 때 언제든 갈 수 있어.
일하느라 바빴어.
그녀가 연락할 때까지 그냥 기다리고 있어.
힘들었어. / 즐거웠어.
10시쯤 시작하자.
조금 짜증났어
살짝 민망해 (쪽팔려)
검색했어 (검색해봤어)
내일모레레
미안, 나 이 전화 받아야해
잘 되길 바래
나 살 안쪘으면 좋겠다
약속 (일정 약속)


Answer Key


I don’t know what to do


I don’t know where to buy that shirt.


I’m currently studying for my exams.


I tried sushi for the first time.


If you want, we can watch a movie.


It’s raining outside.


I want to visit Paris.


I just finished my lunch.


We took a walk.


Can you show me how to use this app?


Anyway, let’s move on to the next topic.


I need to finish my homework.


I’m feeling a little tired today.


I got hurt. / I’m sick


It’s super hot.


You must follow the rules.


I look forward to seeing you next week.


Have you ever tried Indian food?


I want to earn a lot of money.


I’m on the way to work.


I found a great restaurant!


You should eat healthy.


I ran into an old friend.


It’s late already, let’s go home.


I’m working on a new assignment.


I need to set up my new computer.


I looked up “how to say hi in Spanish.”


She’s really good at painting.


Put on your jacket. It’s cold outside.


We ran out of milk.


I need to pick up my medicine.


Can you give me a hand?


I’m interested in learning Spanish.


My flight will take off in an hour.


I’m looking for my keys.


Make sure you lock the door before you leave.


I’m satisfied with my new car.


I just came back home


Korea is famous for Kimchi


it’s not worth it


three days in a row


As I said / As I told you / As I mentioned


I drove for 8 hours there and back (two ways) (back and forth)


Do you recommend it?


I don’t know who to ask


I’m not confident


Busan was holding a beach festival


I’ll show you a picture!


Did you get paid yet?


The fee was very cost efficient


The fine was 500,000 won


I met my middle school friends for the first time in a while (first time in a long time)


You can do whatever you want


Specifically,


she wanted me to go to church


I bought her a bag


She hung up the phone / I picked up the phone


I’m looking forward to the community event


I have to take care of my kids


I was busy taking care of my cats


I think you should write a blog


I hope you like it (move to intermediate?)


I hope [it goes well] (move to intermediate?)


I hope I don’t gain weight (lose weight) (move to intermediate?)


I hope you get better (move to intermediate?)


I’m gonna be in korea this winter


They bought me a lot of food


I’m really into wine these days


I don't like making mistakes


Why don’t you come after getting off work?


Unfortunately,


Thankfully,


To tell you about myself,


I was deciding [whether to drive or to ride a bike].


Whether to do A or B


I don’t think this should be a habit


you dont have to be sorry. it’s okay


By the way, where is the venue again?


she owes me 30,000won


This bag costs 77,000won


the conversation got weird


In conclusion, the project was a success.


In summary, we achieved our goals this year.


All in all, it was a great experience.


I’ve worked out for 5 years now


In the end, everything worked out fine.


it was a waste of money


Normally,


Originally,


Eventually,


for the whole day


she decided not to go to spain


an introvert / an extrovert


how do you say “편리하다" in english? > you say “convenient”


what does “convenient” mean? > it means “편리하다"


yesterday was my day off


I want you to have fun today!


it’s exactly the same as last time


I am deciding whether to meet her again or not


other than the meeting, did you do anything fun?


can’t I attend the next event?


isn’t that rude?


I can come whenever you want


I was busy with work


I’m just waiting for her to contact me.


I had a hard time / I had a good time


let’s start at like 10 ish
it was really annoying
I’m slightly embarrassed
I looked it up
The day after tomorrow
sorry I have to take this call.
I hope [it goes well]
I hope I don’t gain weight
Appointment
`,
  "Beginner: Collect Bulk Answers": `
  Paste student answers written for homework here
The bulk answers should be 5~10 sentences and include the grammar that you learned in the beginner curriculum 

Common Questions (ask all)
Hi XX, long time no see, can you introduce yourself? [talking about oneself] [Must memorize]


What are your hobbies? [Verbal Nouns] [Like to]


What do you do? (what is your job?) Tell me more about your job. [Must memorize]


Timer: 10 minute mark
Additional Questions (All 5 questions are mandatory) (Must say this in bulk) (5~10 sentences)
What did you do today / this morning / yesterday? [past tense]



What are you going to do tomorrow/ on the weekend? [future tense] [be going to V]



Can you tell me about your best friend? [3rd person singular] [likes / does / is]


can you tell me about a close coworker or colleague?


주제별 질문 
Tell me about your family in detail. How many members are there? What do they do?



Let’s have a short conversation. Please ask me at least 5 questions about my family during the conversation.



What neighborhood do you live in? Tell me in detail. What do you like about your neighborhood? what are the characteristics?

Tell me about your house in detail.


tell me about your room?

Let’s have a short conversation. Please ask me at least 5 questions about my house and neighborhood



Question Bank
Family 질문 (make sure they ask at least 5 questions when talking to you) (please
가족을 얼마나 자주 보나요?
가족에 대해 말해주세요
가족 인원이 몇명인가요?
형재 자매가 몇명인가요?
가족과 친한가요?
부모님에 대해 말해주세요 어떤 일을 하시나요?
남편은 어떤 회사에서 일하시나요?
아드님은 미래에 뭘 하실 계획인가요?
혼자 사세요? 아니면 부모님이랑 사시나요?
가족 중 누구랑 가장 친한가요?
형제자매랑 나이 차이가 어떻게 되나요?
몇살 더 많아요?
직업들이 어떻게 되시나요?
House 질문 (make sure they ask at least 5 questions when talking to you)
몇층에 사시나요?
아파트 사세요 집에 사세요?
저는 이 집에 3년동안 살았습니다
경치가 좋아요
집의 가장 마음에 드는 방이 어디에요?
집의 가장 마음에 드는 가구가 뭐에요?
어떤 동네에 사시나요?
이 지역에 얼마나 오래 살았어요?
그게 홈플러스 근처인가요?
이사하고 싶어요?
집에 만족하시나요?
`,
  "Beginner: Filter Grammer": `
  Erase the ones that the student gets right
Grammar Questions (번역시험) (Ask at least 3 questions for each group)
시간 & 날짜


오늘 몇일인가요? 2월 12일 입니다.
생일이 언제인가요? 5월 31일 입니다.
7월 20일 / 11월 30일 / 2월 12일 / 4월 15일
무슨 요일인가요? > 오늘은 수요일이에요
지금 몇시인지 아시나요? > 지금 12시 반이에요
학원 오는데 얼마나 걸리나요? > 한 30분 정도 걸려요 (it takes about half an hour)
미국 언제 갈꺼야? 8월 7일쯤 갈거야.
아침 먹고 나서 2가지 
퇴근 하고 나서 2가지
출근 하고 나서 2가지
과거형 / be 동사 / 일반동사 / 질문 (ask at least 6)


그녀는 행복하지 않았어.
얼마나 오래 영어를 가르쳤니?
어떤 영화 봤어?
그녀는 어떤 음식 좋아한데?
얼마나 오래 영어를 가르쳤니?
얼마나 자주 운동하니?
어떤 영화를 좋아하니?
어떤 게임을 했어?
프랑스 어디에서 살았어?
잘 잤어?
너의 가족은 어디에 살아?
아버님은 어떤 회사에서 일하셔?
어떤 영화를 봤어?
가족과 같이 사니?
그녀는 학교에 가?
가족과 친하니?
그녀는 영어를 공부해?
그는 피자를 좋아해
그는 무슨 공부를 하니?
그녀는 매일 독서해
내 휴가는 11월 13일부터 12월 6일까지야.
나는 7월 7일에 출장이 있어.
8월에 계획이 있어?
일요일에 언제 집에 왔어?
지난 주말에 어디 갔어?
미래형 (ask at least 3) (make sure they know both be going to V & will)


내일 뭐할거니? (will & be going to V)
너 주말에 뭐할거야? (2가지 방법)
토요일에 나 친구 만나러 강남갈거야
우리 아마 저녁 먹고 수다 떨기 위해 카페갈거야
나 내일 미국으로 여행갈거야
나 오늘 수업 끝나고 집 가서 넷플릭스 볼거야
너는? 너는 오늘 수업 끝나고 뭐할거니?
to 부정사 8개 (ask at least 3)


너 햄버거 먹고 싶니?
나는 미래에 경찰이 되기로 결정했어
나는 요즘 일찍 일어나려고 노력중이야
내 남동생이 울기 시작했어
너는 운동하는거 좋아하니?
퇴근하고 술 먹고 싶어
그녀는 집에 가서 그녀의 애들을 위해 요리해줘야해
그는 카페에 가기 위해 압구정에 가야해
저녁을 아내와 같이 먹고 싶었어.
아내는 늦게까지 일해야 했어.
다음 날 6시에 일어나야 해서 일찍 잤어.
저는 넷플릭스 보면서 치킨 먹는 것을 좋아해
Timer: 20 minute mark


위해의 2가지 to V / for N (ask at least 3)


나는 친구를 만나기 위해 홍대에 갔어
나는 부모님을 뵙기 위해 일본에 갔어
나갈 준비를 했어. / 출근 준비를 했어. ( I got ready for work / I got ready to go out)
친구들을 만나러 홍대에 갔어.
수업을 위해 홍대에 왔어.
나 너를 위해 선물 샀어
동안 3가지 (ask at least 3)


나는 아침을 먹는 동안 티비를 봤어
나는 휴가 동안 집에 있었어
3시간 동안 울었어
일 년 동안 영어 공부했어
방학 동안 나는 미국에 갔어
집에 있는 동안 유투브를 봤어


ing 4가지 (ask at least 5)


운동하는 것은 재미있어
요즘 저는 미국을 가기 위해 영어 공부를 하고 있어요
나는 피곤했지만 계속 일했어
나는 취했지만 계속 술을 마셨어
술은 몸에 안 좋아
나는 공부하는 것을 좋아해
나는 피곤했지만 계속 퀴즐렛을 공부했어
운동은 건강에 좋아
나는 요즘 여행하는 중이야
여행하는 것은 내 꿈이야
나는 어제 축구하는 동안 넘어졌어
그것은 피곤했어
TV 보는 것은 재미있어
나 뛸 거야
나 골프 잘쳐
나 요리 못해
난 기다리고 있어 그녀가 나한테 연락하길 (I’m waiting for her to contact me)
그는 졸려지기 시작했어 (I’m starting to get sleepy)
나 취할 예정이야 (I’m planning to get drunk)
나 라면 먹으러 갈려고 했는데, 시간이 부족했어. (I was planning to go eat ramen but I didn't have enough time)
공감표현 empathy expressions (ask at least 2)


그거 정말 지루하겠다
저 피자 엄청 맛있겠다
너 진짜 피곤하겠다
new


그 시험 엄청 어렵겠다
엄청 스트레스 받겠다 (that must be stressful)


Timer: 25 minute mark
인사 표현 / 대화 표현 (ask at least 3)


주말에 재미있는거 했어?
일 외로 다른 것도 하셨나요?
일 외로는 특별한 것 없었습니다
아무것도 안했어
일하느라 바빴어.
친구랑 이야기하느라 바빴어.
어땠어? 재미있었어? > 네 재미있었어요!
홍대에 사람이 많아
비교급 (ask at least 3)


맥주가 소주보다 좋은데 와인이 최고야
맥주가 소주보다 비싼데 와인이 제일 비싸
제 방은 거의 고시원 만큼 작아요
미국은 캐나다 만큼 멀어요
교촌이 BBQ보다 맛있지만 푸라닥이 가장 맛있어요.
어제보다 기분이 나아요.
너 영어 많이 늘었다!
저 골프 많이 늘었어요.
데이빗이 아팠는데 좋아졌어요.
사라가 영어 실력이 좋아졌어요. 이제 거의 [데이비드만큼 잘해요].
횟수(ask at least 2)


저는 보통 가족을 한달에 4번 정도 봐요
저는 2주에 1번 정도 운동을 하는 것 같아요
주 3회 영어 공부하기 시작했어요.
저는 3달에 2번 정도 여행을 가요
부정 질문 (ask at least 2)


너 돈 있지 않아?
너 안배고파?
너 안피곤해?
너 저녁 안먹었어?
너 여자친구 있지 않았어?
저 여자애 영어 하지 않아?
너 누나가 영국 살지 않아?
다시 해보지 그래요? (why don’t you try again?)
그냥 집에 있으면 안돼요? (can’t you just stay home?)
이제 가는건 어때? why don’t we go now?
이번엔 내가 내는게 어때? why don’t I pay this time?
우리 그냥 내일 가면 안돼? can’t we go tomorrow instead?
have pp 3가지


발리 가본적 있어?
두리안 먹어본 적 있어?
해리포터 본 적 있어?
동방신기 들어본 적 있어?
응 나 먹어봤지!
아니 가본 적 없어
한번도 들어본 적 없어
한번도 가본 적 없어


Family 질문 (make sure they ask at least 5 questions when talking to you) (please
가족을 얼마나 자주 보나요?
가족에 대해 말해주세요
가족 인원이 몇명인가요?
형재 자매가 몇명인가요?
가족과 친한가요?
부모님에 대해 말해주세요 어떤 일을 하시나요?
남편은 어떤 회사에서 일하시나요?
아드님은 미래에 뭘 하실 계획인가요?
혼자 사세요? 아니면 부모님이랑 사시나요?
가족 중 누구랑 가장 친한가요?
형제자매랑 나이 차이가 어떻게 되나요?
몇살 더 많아요?
직업들이 어떻게 되시나요?
House 질문 (make sure they ask at least 5 questions when talking to you)
몇층에 사시나요?
아파트 사세요 집에 사세요?
저는 이 집에 3년동안 살았습니다
경치가 좋아요
집의 가장 마음에 드는 방이 어디에요?
집의 가장 마음에 드는 가구가 뭐에요?
어떤 동네에 사시나요?
이 지역에 얼마나 오래 살았어요?
그게 홈플러스 근처인가요?
이사하고 싶어요?
집에 만족하시나요?
`,
  "Beginner: Filter Pillar Expressions": `
  Erase the ones that the student gets right
Beginner Pillar Expressions (ask 20 out of the pool) 
뭘 해야 할지 모르겠어.
그 셔츠를 어디서 사야 할지 모르겠어.
나 지금 시험 공부하고 있어.
나 처음으로 초밥 먹어봤어.
원하면 우리 영화 볼 수 있어.
밖에 비 오고 있어.
파리에 가고 싶어.
방금 점심 다 먹었어.
우리 산책했어.
이 앱 사용하는 방법 알려줄 수 있어?
어쨌든 다음 주제로 넘어가자.
숙제 끝내야 해.
오늘 좀 피곤해.
다쳤어. / 아파.
엄청 더워.
규칙을 따라야 해.
다음 주에 만나는 거 기대돼.
인도 음식 먹어본 적 있어?
돈 많이 벌고 싶어.
출근하는 길이야.
맛집 발견했어!
건강하게 먹어야 해.
오랜만에 옛 친구를 우연히 만났어.
벌써 늦었네, 집에 가자.
새로운 과제 하고 있어.
새 컴퓨터 설정해야 해.
"스페인어로 안녕"을 어떻게 말하는지 검색해봤어.
그녀는 그림을 정말 잘 그려.
외투 입어, 밖에 추워.
우유 다 떨어졌어.
약 받아와야 해.
도와줄 수 있어?
스페인어 배우는 것에 관심 있어.
비행기 한 시간 후에 출발해.
열쇠 찾고 있어.
나가기 전에 문 꼭 잠가.
새 차 마음에 들어.
방금 집에 왔어.
한국은 김치로 유명해.
그럴 가치 없어.
3일 연속으로.
말했듯이.
왕복 8시간 운전했어.
추천해?
누구한테 물어봐야 할지 모르겠어.
자신이 없어.
부산에서 해변 축제 하고 있었어.
사진 보여줄게!
돈 받았어?
요금이 가성비 좋았어.
벌금이 50만 원이었어.
오랜만에 중학교 친구들 만났어.
네가 원하는 대로 해도 돼.
구체적으로,
그녀가 나한테 교회 가라고 했어.
그녀에게 가방 사줬어.
그녀가 전화를 끊었어. / 내가 전화를 받았어.
커뮤니티 행사 기대돼.
아이들을 돌봐야 해.
고양이 돌보느라 바빴어.
블로그 써보는 게 좋을 것 같아.
마음에 들었으면 좋겠어.
잘됐으면 좋겠어.
살 안 쪘으면 좋겠어. (살 좀 빠졌으면 좋겠어.)
빨리 나았으면 좋겠어.
이번 겨울에 한국에 있을 거야.
그들이 나한테 음식 많이 사줬어.
요즘 와인에 푹 빠졌어.
실수하는 거 싫어.
퇴근하고 나서 올래?
안타깝게도,
다행히도,
나에 대해 말하자면,
운전할지 자전거 탈지 고민했어.
A를 할지 B를 할지.
이건 습관이 되면 안 될 것 같아.
미안해할 필요 없어. 괜찮아.
근데 장소가 어디였지?
그녀가 나한테 3만 원 빌렸어.
이 가방 7만 7천 원이야.
대화가 이상하게 흘러갔어.
결론적으로, 프로젝트는 성공했어.
요약하자면, 올해 목표를 달성했어.
전체적으로, 정말 좋은 경험이었어.
운동한 지 5년 됐어.
결국, 다 잘 해결됐어.
돈 낭비였어.
보통,
원래,
결국,
하루 종일,
그녀는 스페인에 안 가기로 했어.
내성적인 사람 / 외향적인 사람
“편리하다”를 영어로 어떻게 말해? > “convenient”이라고 해.
“convenient”가 무슨 뜻이야? > “편리하다”라는 뜻이야.
어제 쉬는 날이었어.
오늘 재미있게 보내길 바래!
지난번이랑 완전 똑같아.
그녀를 다시 만날지 고민 중이야.
회의 말고 다른 재미있는 일 했어?
다음 행사에 참석 못 해?
그거 무례한 거 아니야?
네가 원할 때 언제든 갈 수 있어.
일하느라 바빴어.
그녀가 연락할 때까지 그냥 기다리고 있어.
힘들었어. / 즐거웠어.
10시쯤 시작하자.
조금 짜증났어
살짝 민망해 (쪽팔려)
검색했어 (검색해봤어)
내일모레레
미안, 나 이 전화 받아야해
잘 되길 바래
나 살 안쪘으면 좋겠다
약속 (일정 약속)
`,
  "Beginner: Actual Level Test": `
  The Test Starts Here
Timer: 0 minute mark
Basic Questions 
Date: 한국말로 물어보고 답하기
오늘 날짜가 어떻게 되나요?
오늘 무슨 요일인가요?
Greet the teacher: can you say hi to me in 3 different ways? (aim for the harder ones)
how are you today? > I’m good and you?
how was your day? > it was good and yours?
what did you do today? > there was nothing special
How have you been? > I’ve been good
how is it going? > it’s going well
how are you doing? > I’m doing well
what’s going on? > nothing special
what’s up? > nothing much
how is everything? > everything is good
is everything going well? > yeah, everything’s good
What’s on your mind? > nothing much (there’s nothing on my mind)
It’s been a while! Long time no see > Yeha it’s been a while! How are you?
Let’s catch up sometime!
…and more!
Common Questions (ask all)
Hi XX, long time no see, can you introduce yourself? [talking about oneself] [Must memorize]


What are your hobbies? Tell me in more detail. [Verbal Nouns] [Like to]


What do you do? (what is your job?) Tell me more about your job. [Must memorize]


Timer: 10 minute mark
Additional Questions (All 5 questions are mandatory) (Must say this in bulk) (5~10 sentences)
What did you do today / this morning / yesterday? [past tense]


What are you going to do tomorrow/ on the weekend? [future tense] [be going to V]


Can you tell me about your best friend? [3rd person singular] [likes / does / is]


can you tell me about a close coworker or colleague?
Timer: 15 minute mark
Grammar Questions (번역시험) (Ask at least 3 questions for each group) 
시간 & 날짜


오늘 몇일인가요? 2월 12일 입니다.
생일이 언제인가요? 5월 31일 입니다.
7월 20일 / 11월 30일 / 2월 12일 / 4월 15일
무슨 요일인가요? > 오늘은 수요일이에요
지금 몇시인지 아시나요? > 지금 12시 반이에요
학원 오는데 얼마나 걸리나요? > 한 30분 정도 걸려요 (it takes about half an hour)
미국 언제 갈꺼야? 8월 7일쯤 갈거야.
아침 먹고 나서 2가지
퇴근 하고 나서 2가지
출근 하고 나서 2가지
과거형 / be 동사 / 일반동사 / 질문 (ask at least 6)


그녀는 행복하지 않았어.
얼마나 오래 영어를 가르쳤니?
어떤 영화 봤어?
그녀는 어떤 음식 좋아한데?
얼마나 오래 영어를 가르쳤니?
얼마나 자주 운동하니?
어떤 영화를 좋아하니?
어떤 게임을 했어?
프랑스 어디에서 살았어?
잘 잤어?
너의 가족은 어디에 살아?
아버님은 어떤 회사에서 일하셔?
어떤 영화를 봤어?
가족과 같이 사니?
그녀는 학교에 가?
가족과 친하니?
그녀는 영어를 공부해?
그는 피자를 좋아해
그는 무슨 공부를 하니?
그녀는 매일 독서해
내 휴가는 11월 13일부터 12월 6일까지야.
나는 7월 7일에 출장이 있어.
8월에 계획이 있어?
일요일에 언제 집에 왔어?
지난 주말에 어디 갔어?
미래형 (ask at least 3) (make sure they know both be going to V & will)


내일 뭐할거니? (will & be going to V)
너 주말에 뭐할거야? (2가지 방법)
토요일에 나 친구 만나러 강남갈거야
우리 아마 저녁 먹고 수다 떨기 위해 카페갈거야
나 내일 미국으로 여행갈거야
나 오늘 수업 끝나고 집 가서 넷플릭스 볼거야
너는? 너는 오늘 수업 끝나고 뭐할거니?
to 부정사 8개 (ask at least 3)


너 햄버거 먹고 싶니?
나는 미래에 경찰이 되기로 결정했어
나는 요즘 일찍 일어나려고 노력중이야
내 남동생이 울기 시작했어
너는 운동하는거 좋아하니?
퇴근하고 술 먹고 싶어
그녀는 집에 가서 그녀의 애들을 위해 요리해줘야해
그는 카페에 가기 위해 압구정에 가야해
저녁을 아내와 같이 먹고 싶었어.
아내는 늦게까지 일해야 했어.
다음 날 6시에 일어나야 해서 일찍 잤어.
저는 넷플릭스 보면서 치킨 먹는 것을 좋아해
Timer: 20 minute mark


위해의 2가지 to V / for N (ask at least 3)


나는 친구를 만나기 위해 홍대에 갔어
나는 부모님을 뵙기 위해 일본에 갔어
나갈 준비를 했어. / 출근 준비를 했어. ( I got ready for work / I got ready to go out)
친구들을 만나러 홍대에 갔어.
수업을 위해 홍대에 왔어.
나 너를 위해 선물 샀어
나는 2년 동안 일 하러 일본에 가고 싶어 내 커리어를 위해
동안 3가지 (ask at least 3)


나는 아침을 먹는 동안 티비를 봤어
나는 휴가 동안 집에 있었어
3시간 동안 울었어
일 년 동안 영어 공부했어
방학 동안 나는 미국에 갔어
집에 있는 동안 유투브를 봤어
제가 술을 마시는 동안 비가 그쳤어요 *
공부를 하는 동안 배가 고파졌어요 *
ing 4가지 (ask at least 5)


운동하는 것은 재미있어
요즘 저는 미국을 가기 위해 영어 공부를 하고 있어요
나는 피곤했지만 계속 일했어
나는 취했지만 계속 술을 마셨어
술은 몸에 안 좋아
나는 공부하는 것을 좋아해
나는 피곤했지만 계속 퀴즐렛을 공부했어
운동은 건강에 좋아
나는 요즘 여행하는 중이야
여행하는 것은 내 꿈이야
나는 어제 축구하는 동안 넘어졌어
그것은 피곤했어
TV 보는 것은 재미있어
나 뛸 거야
나 골프 잘쳐
나 요리 못해
난 그녀가 나한테 연락하길 기다리고 있어 (I’m waiting for her to contact me)
그는 졸려지기 시작했어 (I’m starting to get sleepy)
나 취할 예정이야 (I’m planning to get drunk)
나 라면 먹으러 갈려고 했는데, 시간이 부족했어. (I was planning to go eat ramen but I didn't have enough time)
공감표현 empathy expressions (ask at least 2)


그거 정말 지루하겠다
저 피자 엄청 맛있겠다
너 진짜 피곤하겠다
그 시험 엄청 어렵겠다
그거 엄청 스트레스 받겠다 (that must be stressful)
너 엄청 스트레스 받겠다
너네 강아지 진짜 배고프겠다
너 진짜 속상하겠다 / 그거 진짜 속상하겠다 (that must be upsetting)
그거 엄청 흥미롭겠는걸? (that sounds interesting / that must be interesting)
저거 내 차 같이 생겼다
이 노래 kpop 같아
Timer: 25 minute mark
추가 필수 생활 표현 (ask at least 3)


주말에 재미있는거 했어?
일 외로 다른 것도 하셨나요?
일 외로는 특별한 것 없었습니다
아무것도 안했어
일하느라 바빴어.
친구랑 이야기하느라 바빴어.
어땠어? 재미있었어? > 네 재미있었어요!
홍대에 사람이 많아
비교급 (ask at least 3)


맥주가 소주보다 좋은데 와인이 최고야
맥주가 소주보다 비싼데 와인이 제일 비싸
제 방은 거의 고시원 만큼 작아요
미국은 캐나다 만큼 멀어요
교촌이 BBQ보다 맛있지만 푸라닥이 가장 맛있어요.
어제보다 기분이 나아요.
너 영어 많이 늘었다!
저 골프 많이 늘었어요.
데이빗이 아팠는데 좋아졌어요.
사라가 영어 실력이 좋아졌어요. 이제 거의 [데이비드만큼 잘해요].
데에빗이 사라보다 더 좋은 학생이지만 제프가 가장 좋은 학생이에요. *
조깅이 하이킹보다 더 힘들어요.*
횟수 (ask at least 2)


저는 보통 가족을 한달에 4번 정도 봐요
저는 2주에 1번 정도 운동을 하는 것 같아요
주 3회 영어 공부하기 시작했어요.
저는 3달에 2번 정도 여행을 가요
부정 질문 (ask at least 2)


너 돈 있지 않아?
너 안배고파?
너 안피곤해?
너 저녁 안먹었어?
너 여자친구 있지 않았어?
저 여자애 영어 하지 않아?
너 누나가 영국 살지 않아?
다시 해보지 그래요? (why don’t you try again?)
그냥 집에 있으면 안돼요? (can’t you just stay home?)
지금 집에 가는 것은 어떨까? (why don’t we go home now?)
이번에 내가 내는 것은 어때? (why don’t I pay this time?)
우리 그냥 내일 가면 안돼? (can’t we go tomorrow instead?)
have pp 3가지


발리 가본적 있어?
두리안 먹어본 적 있어?
해리포터 본 적 있어?
동방신기 들어본 적 있어?
응 나 먹어봤지!
아니 가본 적 없어
한번도 들어본 적 없어
한번도 가본 적 없어
Timer: 30 minute mark
주제별 질문
Tell me about your family in detail. How many members are there? What do they do?
Let’s have a short conversation. Please ask me at least 5 questions about my family during the conversation.
Please compare you and someone from your family * (just 3 sentences)
Family Question Bank (make sure they ask at least 5 questions when talking to you) (please
가족을 얼마나 자주 보나요?
가족에 대해 말해주세요
가족 인원이 몇명인가요?
형재 자매가 몇명인가요?
가족과 친한가요?
부모님에 대해 말해주세요 어떤 일을 하시나요?
남편은 어떤 회사에서 일하시나요?
아드님은 미래에 뭘 하실 계획인가요?
혼자 사세요? 아니면 부모님이랑 사시나요?
가족 중 누구랑 가장 친한가요?
형제자매랑 나이 차이가 어떻게 되나요?
몇살 더 많아요?
직업들이 어떻게 되시나요?

What neighborhood do you live in? Tell me in detail. What do you like about your neighborhood? what are the characteristics?
Tell me about your house in detail.
tell me about your room?
Please compare your old neighborhood to your new neighborhood ** (just 5 sentences)
Let’s have a short conversation. Please ask me at least 5 questions about my house and neighborhood.
House Question Bank (make sure they ask at least 5 questions when talking to you)
몇층에 사시나요?
아파트 사세요 집에 사세요?
저는 이 집에 3년동안 살았습니다
경치가 좋아요
집의 가장 마음에 드는 방이 어디에요?
집의 가장 마음에 드는 가구가 뭐에요?
집에 대해 가장 마음에 드는 점이 뭔가요?
어떤 동네에 사시나요?
이 지역에 얼마나 오래 살았어요?
그게 홈플러스 근처인가요?
이사하고 싶어요?
집에 만족하시나요?
Timer: 40 minute mark
Beginner Pillar Expressions (ask 20 out of the pool) 
뭘 해야 할지 모르겠어.
그 셔츠를 어디서 사야 할지 모르겠어.
나 지금 시험 공부하고 있어.
나 처음으로 초밥 먹어봤어.
원하면 우리 영화 볼 수 있어.
밖에 비 오고 있어.
파리에 가고 싶어.
방금 점심 다 먹었어.
우리 산책했어.
이 앱 사용하는 방법 알려줄 수 있어?
어쨌든 다음 주제로 넘어가자.
숙제 끝내야 해.
오늘 좀 피곤해.
다쳤어. / 아파.
엄청 더워.
규칙을 따라야 해.
다음 주에 만나는 거 기대돼.
인도 음식 먹어본 적 있어?
돈 많이 벌고 싶어.
출근하는 길이야.
맛집 발견했어!
건강하게 먹어야 해.
오랜만에 옛 친구를 우연히 만났어.
벌써 늦었네, 집에 가자.
새로운 과제 하고 있어.
새 컴퓨터 설정해야 해.
"스페인어로 안녕"을 어떻게 말하는지 검색해봤어.
그녀는 그림을 정말 잘 그려.
외투 입어, 밖에 추워.
우유 다 떨어졌어.
약 받아와야 해.
도와줄 수 있어?
스페인어 배우는 것에 관심 있어.
비행기 한 시간 후에 출발해.
열쇠 찾고 있어.
나가기 전에 문 꼭 잠가.
새 차 마음에 들어.
방금 집에 왔어.
한국은 김치로 유명해.
그럴 가치 없어.
3일 연속으로.
말했듯이.
왕복 8시간 운전했어.
추천해?
누구한테 물어봐야 할지 모르겠어.
자신이 없어.
부산에서 해변 축제 하고 있었어.
사진 보여줄게!
돈 받았어?
요금이 가성비 좋았어.
벌금이 50만 원이었어.
오랜만에 중학교 친구들 만났어.
네가 원하는 대로 해도 돼.
구체적으로,
그녀가 나한테 교회 가라고 했어.
그녀에게 가방 사줬어.
그녀가 전화를 끊었어. / 내가 전화를 받았어.
커뮤니티 행사 기대돼.
아이들을 돌봐야 해.
고양이 돌보느라 바빴어.
블로그 써보는 게 좋을 것 같아.
마음에 들었으면 좋겠어.
잘됐으면 좋겠어.
살 안 쪘으면 좋겠어. (살 좀 빠졌으면 좋겠어.)
빨리 나았으면 좋겠어.
이번 겨울에 한국에 있을 거야.
그들이 나한테 음식 많이 사줬어.
요즘 와인에 푹 빠졌어.
실수하는 거 싫어.
퇴근하고 나서 올래?
안타깝게도,
다행히도,
나에 대해 말하자면,
운전할지 자전거 탈지 고민했어.
A를 할지 B를 할지.
이건 습관이 되면 안 될 것 같아.
미안해할 필요 없어. 괜찮아.
근데 장소가 어디였지?
그녀가 나한테 3만 원 빌렸어.
이 가방 7만 7천 원이야.
대화가 이상하게 흘러갔어.
결론적으로, 프로젝트는 성공했어.
요약하자면, 올해 목표를 달성했어.
전체적으로, 정말 좋은 경험이었어.
운동한 지 5년 됐어.
결국, 다 잘 해결됐어.
돈 낭비였어.
보통,
원래,
결국,
하루 종일,
그녀는 스페인에 안 가기로 했어.
내성적인 사람 / 외향적인 사람
“편리하다”를 영어로 어떻게 말해? > “convenient”이라고 해.
“convenient”가 무슨 뜻이야? > “편리하다”라는 뜻이야.
어제 쉬는 날이었어.
오늘 재미있게 보내길 바래!
지난번이랑 완전 똑같아.
그녀를 다시 만날지 고민 중이야.
회의 말고 다른 재미있는 일 했어?
다음 행사에 참석 못 해?
그거 무례한 거 아니야?
네가 원할 때 언제든 갈 수 있어.
일하느라 바빴어.
그녀가 연락할 때까지 그냥 기다리고 있어.
힘들었어. / 즐거웠어.
10시쯤 시작하자.
조금 짜증났어
살짝 민망해 (쪽팔려)
검색했어 (검색해봤어)
내일모레레
미안, 나 이 전화 받아야해
잘 되길 바래
나 살 안쪘으면 좋겠다
약속 (일정 약속)

Answer Key


I don’t know what to do (move to intermediate?)


I don’t know where to buy that shirt. (move to intermediate?)


I’m currently studying for my exams.


I tried sushi for the first time.


If you want, we can watch a movie.


It’s raining outside.


I want to visit Paris.


I just finished my lunch.


We took a walk.


Can you show me how to use this app?


Anyway, let’s move on to the next topic.


I need to finish my homework.


I’m feeling a little tired today.


I got hurt. / I’m sick


It’s super hot.


You must follow the rules.


I look forward to seeing you next week.


Have you ever tried Indian food?


I want to earn a lot of money.


I’m on the way to work.


I found a great restaurant!


You should eat healthy.


I ran into an old friend.


It’s late already, let’s go home.


I’m working on a new assignment.


I need to set up my new computer.


I looked up “how to say hi in Spanish.”


She’s really good at painting.


Put on your jacket. It’s cold outside.


We ran out of milk.


I need to pick up my medicine.


Can you give me a hand?


I’m interested in learning Spanish.


My flight will take off in an hour.


I’m looking for my keys.


Make sure you lock the door before you leave.


I’m satisfied with my new car.


I just came back home


Korea is famous for Kimchi


it’s not worth it


three days in a row


As I said / As I told you / As I mentioned


I drove for 8 hours there and back (two ways) (back and forth)


Do you recommend it?


I don’t know who to ask


I’m not confident


Busan was holding a beach festival


I’ll show you a picture!


Did you get paid yet?


The fee was very cost efficient


The fine was 500,000 won


I met my middle school friends for the first time in a while (first time in a long time)


You can do whatever you want


Specifically,


she wanted me to go to church


I bought her a bag


She hung up the phone / I picked up the phone


I’m looking forward to the community event


I have to take care of my kids


I was busy taking care of my cats


I think you should write a blog


I hope you like it (move to intermediate?)


I hope [it goes well] (move to intermediate?)


I hope I don’t gain weight (lose weight) (move to intermediate?)


I hope you get better (move to intermediate?)


I’m gonna be in korea this winter


They bought me a lot of food


I’m really into wine these days


I don't like making mistakes


Why don’t you come after getting off work?


Unfortunately,


Thankfully,


To tell you about myself,


I was deciding [whether to drive or to ride a bike].


Whether to do A or B


I don’t think this should be a habit


you dont have to be sorry. it’s okay


By the way, where is the venue again?


she owes me 30,000won


This bag costs 77,000won


the conversation got weird


In conclusion, the project was a success.


In summary, we achieved our goals this year.


All in all, it was a great experience.


I’ve worked out for 5 years now


In the end, everything worked out fine.


it was a waste of money


Normally,


Originally,


Eventually,


for the whole day


she decided not to go to spain


an introvert / an extrovert


how do you say “편리하다" in english? > you say “convenient”


what does “convenient” mean? > it means “편리하다"


yesterday was my day off


I want you to have fun today!


it’s exactly the same as last time


I am deciding whether to meet her again or not


other than the meeting, did you do anything fun?


can’t I attend the next event?


isn’t that rude?


I can come whenever you want


I was busy with work


I’m just waiting for her to contact me.


I had a hard time / I had a good time


let’s start at like 10 ish
it was really annoying
I’m slightly embarrassed
I looked it up
The day after tomorrow
sorry I have to take this call.
I hope [it goes well]
I hope I don’t gain weight
Appointment


Timer: 45 minutes (Done)
`,
  "Intermediate: Mock Test Prep Class 1": `
  Date: 
Mock Test Class 1


Tip 1: Keep taking mock tests every class
Tip 2: Use the “collect bulk answers”, “filter grammar”, and “filter pillar expressions” while taking these mock tests. 
Tip 3: It will take some students 3 classes to prepare for the level test and some students over 16 classes. It depends on how seriously they memorize and review their flashcards. It’s a memorization test. Students must get 70% correct to pass. 
Tip 4: All intermediate bulk answers must include advanced grammar



Part 1: 날짜

날짜 물어봐주시고 대답해주세요. 
요일 물어봐주시고 대답해주세요. 

추가 날짜 (grammar test)
7월 20일 / 11월 30일 / 2월 12일 / 4월 15일 / 8월 22일 / 9월 31일
지금 몇시인지 아시나요? > 지금 12시 반이에요 (현재 시간으로)
학원 오는데 얼마나 걸리나요? > 한 30분 정도 걸려요 (it takes about half an hour)
미국 언제 갈꺼야? > 8월 7일쯤 갈거야. (i’m gonna go on august 7th)

Part 2: 인사

Please greet me in 3 different ways. Do not use easy greetings. 


Part 3: 자기소개
Long time no see, can you introduce yourself again? (bulk answer)
all intermediate bulk answers must include advanced grammar


Part 4: 취미
Tell me more about your hobbies in detail (bulk answer)


Part 5: 직업
Can you tell me more about your job? (bulk answer)


Part 6: 생활의 낙
what do you look forward to in your day?


Part 7: 일 질문 (아래 질문 중 해당되는 최소 3개)
there may be follow up questions
I am looking for any grammar mistakes, the use of advanced grammar, intermediate vocabulary, speed, natural flow
Advanced grammar = Have pp, could, should, relative pronouns, verbal nouns, might

Tell me about a typical day at work
Tell me about your most recent project
What was your previous job?
Why are you taking a break from work?
How are you enjoying taking a break from school / work?
How is being a housewife treating you? (student / an employee)
do you like your company or school? what about your major?
tell me about your team and position?
what do you plan to do for work in your future
do you like school? how is it different from other schools?
do you like your homeroom class?
do you like your homeroom teacher?
are there any professors / managers / coworkers that you like?

Part 8: 스토리텔링 (아래 질문 중 2개)
Must use advanced grammar
Good storytelling = incorporating characters, dialogue, and an entertaining flow. (practice makes perfect)

Tell me about something unexpected that happened recently
Tell me about the most memorable fight or argument you had with someone that you know
Tell me some office gossip. (maybe someone you dislike at work)
Tell me about a situation that annoyed you at work
Tell me about how your kids upset you or made you laugh



Part 9: 관계대명사 & 명사절 (아래 중 7개) (grammar memorization)
저 여자가 [제가 어제 만난 여자]에요.
[제가 좋아했던 그 여자]가 이사 갔어요.
[제가 만난 그 남자]는 코미디언이었어요.
제가 [당신이 만난 사람]을 봤어요.
[제가 어제 뭘 했는지] 기억이 안 나요.
[그녀가 이게 예쁘다고] 말했어요.
[제가 어릴 때], 저는 아팠어요.
제가 [왜 그녀가 화났는지] 모르겠어요.
제가 [당신이 어디 있는지] 알아요.
그게 [제가 우유를 못 마시는 이유]에요.
제가 [당신이 거짓말한 걸] 알아요.
[제가 예쁘지 않다고] 생각했어요.
제가 [1000원짜리 물]을 샀어요.
[제가 좋아하는 음식]은 피자예요.
[제가 일하는 회사]는 부산에 있어요.
제가 좋아하는 장면은 [주인공이 악당과 싸우는 장면]이에요.
제가 좋아하는 [여자를 만났어요].
[그게 바로 당신을 좋아하는 이유예요].
제가 [포레스트 검프라는 영화]를 봤어요.
저는 [유명한 케이팝 보이그룹인 BTS]를 좋아해요.
나는 그가 내 이름을 기억하는지 궁금해.
나는 네가 여행을 즐겼기를 바라.
그녀는 왜 늦었는지 설명했어.
내가 이걸 제시간에 끝낼 수 있을지 확신이 안 서.
나는 오늘이 그녀의 생일이라는 걸 잊었어.
나는 네가 내일 쉬는 날인 걸 알기 때문에 계획을 세웠어.
그가 쓴 보고서가 이 프로젝트의 핵심 자료야.
그가 언급했던 프로젝트가 드디어 시작됐어.
내가 다니는 헬스장은 24시간 운영해.
그녀가 요리한 음식이 오늘의 메인 요리야.
내가 매일 이용하는 지하철역이 이번 주에 공사 중이야.





Recommended Homework: 
Add all bulk answers + grammar mistakes to the flashcards
Teachers must filter out the ones that the students know for sure from the “filter grammar” & “filter pillar expressions” as well as updating the “collect bulk answers" tab with their most recent answers. 
From this point on it really depends on how good the student is at memorizing 
`,
  "Intermediate: Mock Test Prep Class 2": `
  Date: 
Mock Test Class 2


Tip 1: Keep taking mock tests every class
Tip 2: Use the “collect bulk answers”, “filter grammar”, and “filter pillar expressions” while taking these mock tests. 
Tip 3: It will take some students 3 classes to prepare for the level test and some students over 16 classes. It depends on how seriously they memorize and review their flashcards. It’s a memorization test. Students must get 70% correct to pass. 
Tip 4: All intermediate bulk answers must include advanced grammar



Part 10: 영화 (또는 애니, 웹툰, 드라마, 책, 등등) (최소 2개)
What movie did you watch recently?
What was the story about in detail?
What is your all time favorite movie?
What was the story about in detail?
Why do you like this movie so much?
Tell me about your favorite actor or actress and why you like them. What did they come out in?
what TV program did you watch when you were a kid? what is it about?


Part 11: 인사

Let’s have a conversation. Please ask me about my childhood, where I grew up, and how I came to korea. (refer to the expressions below)


Make the student ask you about 5~10 questions about yourself and your foreign background

Must use at least 5 of the following questions
(The flow of questioning must be natural)

 For David


Where did you grow up?
Where in the states did you live?
What state are you from?
Do you miss living in america?
Are you planning to go back anytime soon?
Where do you like living better? Korea or the US?
How long has it been since you lived in the US?
What’s the best part about living in korea? (being back in korea)
Do you speak any other lanugages?
Did you live anywhere else other than the US? (any other countries)
Where did you go to school?

For other teachers (try to memorize this one as well)


Are you teaching full time?
Where did you learn your english? (how to speak english)
how long did you live in ~
How long has it been since you came back to korea?
what brings you back to korea?
Are you staying for good? or are you just visiting for a while?
Where do you prefer living?
What do you miss about your home country?
Have you traveled in other countries as well?
Did you get to travel a lot in korea?
What’s the best part about living in Germany?
How is korea treating you?
What was your job back in California?
Are there any places you recommend to visit back in France?
How many languages do you speak?
How is korea compared to Europe?
How’s the food treating you?



Part 12: 술
All answers must incorporate storytelling & advanced grammar

When is the last time that you drank?
Do you drink often?
Tell me about a embarrassing drinking experience (must explain situation well / express why it was embarrassing)
Recommend a pub and explain why you like it
what can I order there? What do they serve?
Ask me 5 drinking questions & have a small conversation with me regarding the topic
The questions cannot all be too easy and must connect like a conversation



Part 13: 연애
All answers must incorporate storytelling & advanced grammar

Tell me about your most recent dating experience
Why didn’t it work out? / How is the relationship going?
What are your thoughts about marriage and kids?
What is your ideal type? Does that person match your ideal type?
Do you have a crush on someone right now? what kind of person are they?
Tell me about your ex (if it’s okay to ask)
Ask me 5 dating questions & have a small conversation with me regarding the topic
The questions cannot all be too easy and must connect like a conversation
What is your ideal date?



Part 14: 아플 때
All answers must incorporate storytelling & advanced grammar

Tell me about the last time you were sick. How were you sick and how painful was it? How did you recover?
Tell me about the last time you hurt yourself physically. What happened and how painful was it? How did you deal with it?
Are you stressed nowadays? What are you stressed about? How are you dealing
with it?
When is the last time that you went to the hospital?
Ask me 5 questions about being sick or hurt and have a small conversation with me regarding the topic
The questions cannot all be too easy and must connect like a conversation



Part 15: 기둥표현들 (20개 물어보기)
가능하면 헬스장에 갈 수도 있어.
이 영화는 해리 포터와 비슷해.
그게 우리가 지난번에 본 거 아니야?
그 영화는 우리가 지난주에 본 거야.
오랜만에 옛 친구와 안부를 나눴어. (근황토크)
한국에서 가장 유명한 레스토랑 중 하나에서 식사했어.
날씨에 따라 달라.
나는 모든 종류의 음악을 좋아하지만, 특히 재즈를 사랑해.
어떻게든 프로젝트를 끝냈어.
프로젝트가 어려웠지만, 그래도 끝냈어.
원래는 해외여행을 계획했지만, 대신 집에 있기로 결정했어.
보통 나는 매일 아침 7시에 일어나.
결론적으로 2가지
결국에는 2가지
드디어 2가지
결과로서
내가 파티에 가지 않은 이유는 일 때문에 너무 지쳤기 때문이야.
내가 고향을 마지막으로 방문한 것은 아주 오래 전이야.
버스를 놓쳤어. 그래서 늦었어.
등산은 힘들었지만, 그만한 가치가 있었어.
개인적으로, 나는 이것이 최선의 선택이라고 생각해.
건강에 좋지 않다는 걸 알지만, 어쩔 수 없어.
150만원은 달러로 얼마야?
그는 나에게 30만원을 빚졌어.
대화가 이상해졌어.
카페에서 전 애인을 만났을 때 어색했어.
이 프로젝트를 통해 그녀를 잘 알게 됐어. (close 아님)
우리는 아직 서로를 알아가는 중이야.
그 영화를 보는 것은 시간 낭비였어.
그 비싼 가방을 사는 것은 돈 낭비였어.
내가 너라면, 매니저와 얘기할 거야.
이것 좀 도와줄 수 있을까?
결국 그 행사에 자원봉사를 하게 됐어.
왠지 그 노래에 대해 계속 생각이 났어.
그녀는 내내 조용했어.
그런데, 장소가 어디였지?
어쩔 수 없어.
어제 소개팅을 가기로 했는데 취소됐어.
그렇게 했어야 했는데.
내가 너라면 그렇게 했을 거야.
결국 시험에 늦었어.
중간고사를 거의 다 끝냈어.
우리 아이들이 잘 어울려서 기뻐.
내가 너라면, 나도 긴장됐을 거야.
왠지 잠을 잘 수 없었어.
대략 5만원 정도 들었어.
빨리 끝내자.
그만한 가치가 있었어! / 그만한 가치가 없었어.
네가 자고 있을 거라고 생각했어.
다이어트 중이라서 체중을 줄이려고 노력 중이야.
지난 2주 동안 체중이 많이 늘었어.
넷플릭스 시리즈의 이 밈이 소셜 미디어에서 바이럴했어.
난 그걸 믿지 않아!
일반적으로, 달리기에서 여자들은 남자들을 따라가지 못해.
행사에 더 일찍 왔어야 했는데! 하지만 교통이 혼잡했어.
낙관적인 / 비관적인
응원할게! / 널 응원해!
얼마나 오래 밖에 있었어?
우리는 서로 그다지 잘 맞지 않아.
우리 사이에 잘 안 될 것 같아.
그게 정말 필요해?
오늘 당직이야 (야간 근무)
어제 우리가 산 것보다 두 배나 비싸 (두 배의 가격)
그냥 안 가면 안 돼?
어떻게 될지 두고 보자!
가야 한다는 압박감을 느꼈어 / 나한테 압박 주지 마!
아무도 그 이유를 몰라.
그가 떠났다는 것도 몰랐어.
왜 그런 거야?
그게 무슨 상관이야?
너에게 부담을 주고 싶지 않아.
그가 안타까웠어.
너의 의견으로는 어떤 게 제일 좋아?
그 돈을 너한테 쓰는 게 낫겠어.
술 마시러 가는 것보다 운동하러 가는 게 낫겠어.
당황한 / 당황스러운
좀 주제에서 벗어나지만...
10명 중 9명은 그렇게 할 거야.
다시 생각해보니, 그 가방을 사지 말았어야 했어.
나는 "프렌즈" TV 쇼에 완전히 빠졌어.
말 끊어서 미안해.
약 먹는 걸 잊었어.
사업은 어떻게 돼가?
부럽다 / 네가 부러워.
내가 말했는지 모르겠네.
너와는 관련이 없어 / 너와는 아무 상관이 없어.
지난 2개월 동안
분위기를 읽어 / 조심스럽게 행동해
짧은 방문인데도 항상 내가 음식값을 내야 해.
나 얘기는 그만하고, 너희 얘기 좀 해봐.
모니터 암이 뭔지 알아?
정신적 붕괴가 왔어.
나 자신에게 매우 실망했어.
네가 나를 사랑하는 한
네가 일만 하면 돼.
내가 아는 바로는
걱정 마, 내가 먼저 연락할게.
최악의 상황이 뭐야?
신기하게도,
나이가 먹을수록 (2가지)
시간이 갈수록
다시 고민중이야
나 FOMO 있어
이거 처음부터 만들었어
너무 신사다 (예의바르다)
그녀는 완벽주의자야
너 편하게 말할 수 있었으면 좋겠어
다른 이야기긴 한데 (3가지)
밤샜다 (2가지)
해볼만해 (2가지)
Answer Key
Intermediate Pillar expressions (ask 20)
I might go to the gym later if I can.
This movie is similar to Harry potter
isn’t that what we watched last time?
The movie is one that we watched last week.
I caught up with an old friend for the first time in a while.
I dined at one of the most famous restaurants in Korea.
It depends on the weather.
I like all kinds of music, but I specifically love jazz.
I finished the project somehow
even though the project was difficult, I finished it (even if)
Originally, I planned to travel abroad, but I decided to stay home instead.
Normally, I wake up at 7 AM every day.
All in all / In conclusion
eventually / In the end
finally / at last
As a result
The reason that I didn’t go to the party was because I was too drained from work.
The last time that I visited my hometown was ages ago.
I missed the bus. That’s why I was late.
The hike was tough, but it was worth it.
Personally, I think this is the best option.
I know it’s unhealthy, but I can’t help it.
How much is 1,500,000 won in dollars?
He owes me 300,000 won.
The conversation got weird.
It felt awkward when I met my ex at the café.
I got to know her well through this project.
we’re still getting to know each other
Watching that movie was a waste of time.
Buying that expensive bag was a waste of money.
If I were you, I would talk to the manager.
Would you mind helping me with this?
I ended up volunteering for the event.
For some reason, I couldn’t stop thinking about that song.
She was quiet for the whole time.
By the way, where is the venue again?
I can’t help it
I was supposed to go on a blind date yesterday but it got canceled
I should’ve {~했었어야 했다}
I would’ve {나라면 ~를 했을 것이다}
I ended up being late to the test
I’m pretty much done with my midterms
I’m glad that our kids got along
if I were you, I would be nervous too
I couldn’t sleep for some reason
it cost roughly 50,000won
let’s get it over with
it was worth it! / it wasn’t worth it
I figured that you were sleeping
I’m trying to lose weight because I’m on a diet.
I gained a lot of weight over the last 2 weeks.
this meme from a netflix series went viral on social media. (it blew up)
I don’t buy it!
generally, girls can’t keep up with guys when running
I should’ve come to the event earlier! but the traffic was heavy.
optimistic / pessimistic
I’m cheering for you! / I’m rooting for you!
how long did you stay out?
we’re not that compatible with each other
it’s not gonna work out between us
is that even neccesary?
I’m on duty today (the night shift)
it’s twice as expensive as the one we bought yesterday (twice the price)
why can’t we just not go?
we’ll see how it goes!
I felt pressured to go / stop pressuring me!
no one knows why
I didn’t even know that he left
why is that the case?
what does that have to do with anything?
I don’t want to burden you
I felt bad for him
In your opinion, which one is the best?
I would rather spend that money on you
I would rather go work out than go drink
embarrassed / embarrassing
this is kind of a tangent but ..
9 out of 10 people would do that
on second thought, I should’ve never bought that bag
I’m totally obsessed with the TV show “friends”
sorry to cut you off
I forgot to take my medicine
how is your business going?
I'm jealous / I envy you
I'm not sure if I told you
it’s not related with / it doesn’t have anything to do with you
for the last 2 months
read the room / walk on eggshells
I always have to pay for food even though it’s a short visit.
enough about me, tell me about you guys
do you know what a monitor arm is?
I had a mental breakdown
I was very disappointed in myself
as long as you love me
as long as you do your work, it’s all good
from what I know
don’t worry, I’ll reach out first
what’s the worst case scenario?
interestingly enough,
As I get older / the older I get
As time goes by
I’m having second thoughts
I have FOMO (fear of missing out)
we made this from scratch
he’s such a gentleman
she’s a perfectionist
I want to be able to say it more comfortably
that was a tangent / that was off topic / we sidetracked a bit
I pulled an all nighter / I stayed up all night
it's worth a try
Pillar Vocab (ask 10)
보아하니 / 듣자 하니


엄밀히 말하면 / 기술적으로


협상하다


정착하다 / 자리 잡다


재무 감사


은퇴하다


동시에


까다로운


주식과 채권에 투자하다


고려하다 / 생각하다


~을 언급하다 / ~을 참조하다


~에 관하여 / ~와 관련하여


회의적인


피해망상적인 / 과민한


자극하다


유능한 직원


시간을 잘 지키는 / 시간 엄수하는


정치


욕설 / 욕하기


총각 파티 / 신부 파티 (결혼 전 파티)


스트리퍼들 (춤추는 사람들)


장소 / 개최지


의무적인 / 필수의


무언가가 유행하고 있다


망설이고 있어요


편리한


직설적인 / 솔직한


숙소 / 숙박 시설


다과 / 음료수들


야망 있는 / 포부가 큰


느긋한 / 여유로운 (혹은 "진정해"라는 표현으로도 사용)


기진맥진한 / 매우 지친


꽃뱀들 (돈만 노리는 사람들)


일생에 한 번뿐인 기회


귀걸이 / 목걸이 / 팔찌들


치아 교정기 (브레이스)


치실 (플로스)


섬세하고 배려심 있는


존중하는 / 예의 있는


오글거리는 / 민망한


증명하다 / 승인(허가)하다


선거에서 투표하다


장례식


공통 친구들


~을 이용하다 (부정적 뉘앙스 포함 가능)


병가를 내다 (아프다고 연락하다)


집착하는 / 푹 빠진


첫째로 / 둘째로


직설적인 / 솔직한


Vocab (ask 10) > make fun phrases chapter
apparently,
technically,
negotiate
settle down
financial audit
retire
simultaneously
picky
invest in stocks and bonds
consider
refer to
regarding ~
skeptical
paranoid(delete?)
stimulate
a competent employee
punctual
politics
swearing / cussing / cursing
bachelor party / bridal shower
strippers
venue
mandatory
something is trending
i’m hesitating
convenient
straightforward / direct
accommodation
refreshments / beverages
ambitious
chill
exhausted
gold diggers
once in a lifetime opportunity
earrings / necklaces / bracelets
braces
floss
sensitive and caring
respectful
cringy
prove / approval
vote for the election
funeral
mutual friends
take advantage of
call in sick
obsessed
first of all / second of all
straightforward



Recommended Homework: 
Add all bulk answers + grammar mistakes to the flashcards
Teachers must filter out the ones that the students know for sure from the “filter grammar” & “filter pillar expressions” as well as updating the “collect bulk answers" tab with their most recent answers. 
From this point on it really depends on how good the student is at memorizing 
`,
  "Intermediate: Collect Bulk Answers": `Paste student answers written for homework here 

Common questions (ask all)
Hi XX, long time no see, can you introduce yourself? [talking about oneself] [Must memorize an upgraded version]


What are your hobbies nowadays? What are you into? Tell me in detail (Or: tell me about your hobbies in more detail!) [Must memorize upgraded version]


what do you look forward to in your day?


What do you do? (what is your job?) Tell me more about your job & company. [Must memorize upgraded version] (skip if it was mentioned in detail already)
Or : tell me about being a student. How is it? do you wanna grow up faster? (For students)
(There may be follow up questions to test their basic grammar and speed)



Work questions (ask at least 3 that apply to them)
there may be follow up questions
I am looking for any grammar mistakes, the use of advanced grammar, intermediate vocabulary, speed, natural flow
Advanced grammar = Have pp, could, should, relative pronouns, verbal nouns, might

Tell me about a typical day at work

Tell me about your most recent project

What was your previous job?

Why are you taking a break from work?

How are you enjoying taking a break from school / work?

How is being a housewife treating you? (student / an employee)

do you like your company or school? what about your major?

tell me about your team and position?

what do you plan to do for work in your future

do you like school? how is it different from other schools?

do you like your homeroom class?

do you like your homeroom teacher?

are there any professors / managers / coworkers that you like?

Storytelling (ask at least 2) (click to open up)
Must use advanced grammar
Good storytelling = incorporating characters, dialogue, and an entertaining flow. (practice makes perfect)

Tell me about something unexpected that happened recently

Tell me about the most memorable fight or argument you had with someone that you know

Tell me some office gossip. (maybe someone you dislike at work)

Tell me about a situation that annoyed you at work

Tell me about how your kids upset you or made you laugh

Movies (ask at least 2) 
(or TV shows, Anime, webtoons, books, entertainment shows)

(must use multiple relative pronouns & verbal nouns ) 
What movie did you watch recently?
What was the story about in detail?

What is your all time favorite movie?
What was the story about in detail
Why do you like this movie so much?

Ask me 3 questions about my movie taste and recommend a movie for me and explain why you think I would like it

Tell me about your favorite actor or actress and why you like them. What did they come out in?

what TV program did you watch when you were a kid? what is it about?





Drinking (ask at least 2)
All answers must incorporate storytelling & advanced grammar

When is the last time that you drank?

Do you drink often?

Tell me about a embarrassing drinking experience (must explain situation well / express why it was embarrassing)

Recommend a pub and explain why you like it
what can I order there? What do they serve?

Ask me 5 drinking questions & have a small conversation with me regarding the topic
The questions cannot all be too easy and must connect like a conversation


Dating (ask at least 2)
All answers must incorporate storytelling & advanced grammar
Tell me about your most recent dating experience

Why didn’t it work out? / How is the relationship going?

What are your thoughts about marriage and kids?

What is your ideal type? Does that person match your ideal type?

Do you have a crush on someone right now? what kind of person are they?

Tell me about your ex (if it’s okay to ask)

Ask me 5 dating questions & have a small conversation with me regarding the topic
The questions cannot all be too easy and must connect like a conversation



Being sick (ask at least 2)
All answers must incorporate storytelling & advanced grammar

Tell me about the last time you were sick. How were you sick and how painful was it? How did you recover?

Tell me about the last time you hurt yourself physically. What happened and how painful was it? How did you deal with it?

Are you stressed nowadays? What are you stressed about? How are you dealing with it?

When is the last time that you went to the hospital?

Ask me 5 questions about being sick or hurt and have a small conversation with me regarding the topic
The questions cannot all be too easy and must connect like a conversation		
`,
  "Intermediate: Filter Grammer": `
  Erase the ones that the student gets right
Grammar: Verbal Nouns and Relative Pronouns (ask at least 7) 
저 여자가 [제가 어제 만난 여자]에요.  
[제가 좋아했던 그 여자]가 이사 갔어요.  
[제가 만난 그 남자]는 코미디언이었어요.  
제가 [당신이 만난 사람]을 봤어요.  
[제가 어제 뭘 했는지] 기억이 안 나요.  
[그녀가 그것이 예쁘다고] 말했어요.  
[제가 어릴 때], 저는 아팠어요.  
제가 [왜 그녀가 화났는지] 모르겠어요.  
제가 [당신이 어디 있는지] 알아요.  
그게 [제가 우유를 못 마시는 이유]에요.  
제가 [당신이 거짓말한 걸] 알아요.  
[제가 예쁘지 않다고] 생각했어요.  
제가 [1000원짜리 물]을 샀어요.  
[제가 좋아하는 음식]은 피자예요.  
[제가 일하는 회사]는 부산에 있어요.  
제가 좋아하는 [여자를 만났어요]. 
[그게 바로 당신을 좋아하는 이유예요].  
저는 유명한 영화인 포레스트 검프를 좋아해요
저는 유명한 kpop 보이그룹인 BTS를 좋아해요
저거 [내가 어제 산] 거야.
걔는 [내가 파티에서 만난] 여자애야.
나 [내가 매일 아침 가는] 카페에 갔어.
걔는 [내가 얘기했던] 남자야.
저거 [내가 지금 보고 있는] 프로그램이야.
걔는 [내가 매일 문자하는] 친구야.
저기가 [내가 식료품 사는] 곳이야.
저게 [내가 찾고 있던] 거야.
걔는 [내가 점심 같이 먹는] 사람이야.
이거 [내가 요즘 빠져있는] 게임이야.
저기가 [우리가 지난 금요일에 놀았던] 바야.
걔는 [내가 너한테 말했던] 사람이야.
저기가 [내가 밥 먹고 싶은] 식당이야.
이거 [모두가 얘기하고 있는] 영화야.
저거 [내가 항상 주문하는] 음식이야.
여기가 [내가 매 주말마다 술 마시는] 곳이야.
걔는 [나 이사하는 거 도와준] 친구야.
그때가 [내가 변해야겠다고 깨달은] 순간이야.
이게 [내가 항상 늦는] 이유야.
저게 [내가 한국을 떠나야 하는] 이유야.
나는 그가 내 이름을 기억하는지 궁금해.
나는 너가 여행을 즐겼기를 바래.
그녀는 왜 늦었는지 설명했어.
내가 이걸 제시간에 끝낼 수 있을지 확신이 안 서.
나는 오늘이 그녀의 생일이라는 걸 잊었어.
나는 네가 내일 쉬는 날인 걸 알기 때문에 계획을 세웠어.
그가 쓴 보고서가 이 프로젝트의 핵심 자료야.
그가 언급했던 프로젝트가 드디어 시작됐어.
[내가 다니는 헬스장은] 24시간 운영해.
[그녀가 요리한 음식이] 오늘의 메인 요리야.
[내가 매일 이용하는 지하철역이] 이번 주에 공사 중이야.
내일 [우리가 등산을 갈 수 있을지] 모르겠어. (whether / if)
나는 전을 먹었는데 그것은 한국 전통 펜케익 같은거야
나는 막걸리를 마셨는데 그것은 한국 전통 술의 종류야
나는 [그가 추천한 곳에] 못갔어
그곳은 [아이스크림을 파는 카페였어]
나는 [그가 얼마나 많이 마셨는지]에 충격 받았어.
나도 여의도에 [벚꽃이 많다는 것을] 알고 있어.
나 [그 영화 본 다른 학생을] 가르치고 있어.
그게 [내가 마지막으로 마셨을 때야].
 [내가 예상한게] 아닌데.





Talking to a foreigner 

Let’s have a conversation. Please ask me about my childhood, where I grew up, and how I came to korea. (refer to the expressions below)
(Make the student ask you about 5~10 questions about yourself and your foreign background)
Must use at least 5 of the following questions
The flow of questioning must be natural


Questions Bank

 For David


Where did you grow up?
Where in the states did you live?
What state are you from?
Do you miss living in america?
Are you planning to go back anytime soon?
Where do you like living better? Korea or the US?
How long has it been since you lived in the US?
What’s the best part about living in korea? (being back in korea)
Do you speak any other lanugages?
Did you live anywhere else other than the US? (any other countries)
Where did you go to school?

For other teachers (try to memorize this one as well)


Are you teaching full time?
Where did you learn your english? (how to speak english)
how long did you live in ~
How long has it been since you came back to korea?
what brings you back to korea?
Are you staying for good? or are you just visiting for a while?
Where do you prefer living?
What do you miss about your home country?
Have you traveled in other countries as well?
Did you get to travel a lot in korea?
What’s the best part about living in Germany?
How is korea treating you?
What was your job back in California?
Are there any places you recommend to visit back in France?
How many languages do you speak?
How is korea compared to Europe?
How’s the food treating you?
`,
  "Intermediate: Filter Pillar Expressions": `
  Erase the ones that the student gets right

Intermediate Expressions & Vocab Part 1

이 영화 해리 포터랑 비슷해.
이거 우리가 지난주에 본 영화야(거야).
나 한국에서 제일 유명한 음식점 중 하나에서 밥 먹었어.
결론적으로 / 정리하자면
결국에는 / 마지막엔
그래서 결과적으로
내가 파티 안 간 이유는 일 때문에 너무 기빨려서였어.
내가 고향 마지막으로 방문한 게 엄청 오래됐어.
긍정적인 / 부정적인
부담 주지 마!
민망한 / 민망하게 하는
난 차라리 그 돈을 너한테 쓰고 싶어.
난 차라리 술 마시러 가는 것보다 운동하러 갈래.
나 질투나 / 부러워.
내가 말했는지 모르겠는데~
지난 2개월 동안.
나 정신적으로 무너졌어.
내가 알기로는.
네가 날 사랑하는 한.
최악의 상황은 뭐야?(최상의 상황은?)
오랜만에 옛 친구랑 만났어.
날씨에 달렸어.
가능하면 나중에 헬스장 갈 수도 있어.
보통 나는 매일 아침 7시에 일어나.
드디어 / 마침내
버스 놓쳤어. 그래서 늦었어.
등산이 힘들었지만, 가치 있었어.
어쩔 수 없어.
걔가 나한테 30만원 빚졌어.
개인적으로, 이게 최선의 선택인 것 같아.
대화가 이상해졌어.
우린 아직 서로 알아가는 중이야.
이 프로젝트를 통해 걔를 잘 알게 됐어.
결국 내가 그 행사에 자원봉사하게 됐어.
이거 좀 도와줄래?
걔는 내내 조용했어.
왠지 그 노래가 계속 생각나더라.
공부 더 열심히 했어야 했는데.
중간고사 거의 다 끝났어.
응원할게! / 너 응원해!
얼마나 오래 밖에 있었어?
어떻게 될지 두고 보자!
걔가 불쌍했어.
약 먹는 거 깜빡했어.
말 끊어서 미안해.
내 자신한테 너무 실망했어.
그냥 궁금한데, 어떤 영화 봤어?
내가 너라면 나도 긴장됐을 거야.
왠지 잠이 안 왔어.
대략 5만원 정도 했어.
시간이 지날수록
먹을수록 더 좋아져.
여자친구가 운전하지 말라고 했어.
우리 애들이 잘 지내서 다행이야.
단어
까다로운
정착하다
은퇴하다
고려하다
참조하다
~에 관해서
편리한
편안한/여유로운
지친
존중하는
장례식
공통 친구
아프다고 연락하다
집착하는
첫째로 / 둘째로
솔직한 / 직설적인
치아교정기
치실
정치
욕하기 / 욕설
장소
유행하는 것
음료수 / 음료
귀걸이 / 목걸이 / 팔찌
명백히
기술적으로
오글거리는
어색한
감당할 수 있는
처리하다
말이 돼!
내가 알아낼게
이제 괜찮아
기대돼
웃긴


Intermediate Expressions & Vocab Part 2

우리가 지난번에 본 거 아니야?
나 모든 종류의 음악 좋아하는데, 특히 재즈를 좋아해.
어떻게든 프로젝트 끝냈어.
프로젝트가 어려웠지만, 끝냈어.
원래는 해외여행 갈 계획이었는데, 대신 집에 있기로 했어.
건강에 안 좋은 거 알지만, 어쩔 수 없어.
150만원이 달러로 얼마야?
카페에서 전 애인을 만났을 때 어색했어.
그 영화 보는 건 시간 낭비였어.
그 비싼 가방 사는 건 돈 낭비였어.
내가 너라면, 매니저한테 말할 거야.
그런데, 장소가 어디였지?
어제 소개팅 갈 예정이었는데 취소됐어.
결국 시험에 늦었어.
빨리 끝내자.
네가 자고 있을 거라 생각했어.
다이어트 중이라서 살 빼려고 해.
지난 2주 동안 살이 많이 쪘어.
넷플릭스 시리즈에서 나온 이 밈이 소셜미디어에서 바이럴 됐어. (대박났어)
말도 안 돼! (안 믿어!)
보통 여자애들은 달리기에서 남자애들을 따라가지 못해.
행사에 더 일찍 왔어야 했는데! 근데 교통체증이 심했어.
우리는 서로 그렇게 잘 맞지 않아.
우리 사이에 잘 안 될 것 같아.
그게 정말 필요해?
오늘 당직이야 (야간 근무).
이게 우리가 어제 산 것보다 두 배 비싸.
우리 그냥 안 가면 안 돼?
아무도 왜인지 몰라.
걔가 떠난 줄도 몰랐어.
왜 그런 거야?
그게 이거랑 무슨 상관이야?
너한테 부담 주기 싫어.
너 생각에는 어떤 게 제일 좋아?
좀 삼천포로 빠지는데...
10명 중 9명은 그렇게 할 거야.
다시 생각해보니, 그 가방 절대 사지 말았어야 했어.
나 '프렌즈' 드라마에 완전 빠졌어.
사업은 어떻게 돼가?
그건 너랑 관련 없어 / 너랑 아무 상관 없어.
분위기 파악해 / 조심해서 말해.
짧게 방문해도 항상 밥값 내야 해.
나 얘기는 됐고, 너희 얘기 좀 해봐.
모니터 암이 뭔지 알아?
네 일만 잘하면 괜찮아.
걱정 마, 내가 먼저 연락할게.
가야 할 것 같은 부담감이 있었어.
흥미롭게도,
우리 셰프가 운영하는 펜션을 예약했어.
나이 들수록
다시 생각해보고 있어.
나 FOMO야 (놓치는 것에 대한 두려움)
우리가 이걸 처음부터 만들었어.
걔는 정말 신사야.
그녀는 완벽주의자야.
더 편하게 말할 수 있게 되고 싶어.
그건 좀 삼천포로 빠졌어 / 주제에서 벗어났어 / 우린 좀 딴길로 샜어.
어휘
협상하다
재무 감사
동시에
주식과 채권에 투자하다
의심스러운
자극하다
유능한 직원
시간을 잘 지키는
총각 파티 / 브라이덜 샤워
스트리퍼
필수적인
망설이고 있어
숙박 시설
야심 찬
골드 디거 (돈 목적의 교제)
일생에 한 번뿐인 기회
세심하고 배려하는
증명하다 / 승인
선거에 투표하다
이용하다
일반적으로
마지막 순간에
일부러
스트레스 받은
압도된
의욕 있는
연기하다
(계획을) 고수하다
돋보이다
공감할 수 있어
~처럼 보이다
연락하며 지내다
조만간
다시 생각해보면
아이디어를 떠올리다
처리하다
실수로 (우연히)
`,
  "Intermediate: Actual Level Test": `
  Grading Rubric


Must get over 65% correct + major bulk answers all correct
Forgive: a, the, plural s, and sentences that mean the same thing and sound natural
Will fail the question if it takes too long for student to respond
The test will keep being updated so please adjust your mock tests according to this page
Rules: you can share the actual questions with the students . You can even share the link for the test.


I will try to finish the test in 45 minutes and give feedback for 15 minutes.
Take notes via google docs
Key: * = small mistake (will forgive) / ** = this mistake will affect grade / *** = big mistake (should not appear at this level)
How students usually fail


Simply not memorizing the expressions
if your student took class properly, these sentences shouldn’t be too difficult to memorize. They should already know 80% of the sentence but will make small mistakes when you test them. Use the pressure from the exam to do make sure students know these expressions for sure.
You already know what will come out on the test. If the student still gets it wrong, they just didn’t study or are not qualified to take this test.
The Teacher didn’t help students make long form scripts
There are no curveballs with the long form speaking questions. Help students write responses that you know will pass and make sure to buff out any small grammar mistakes through mock tests.
You didn’t take enough mock tests
you think they know, they think they know, but sometimes they still get it wrong regardless
make sure you start mock testing at least 1 month before the exam.
me personally I just put everything they get wrong into quizlet > and then do the mock test again.
(no need to review everything via quizlet. just review via another mock test)
record the mock tests and send it to them
If your students don’t study, just mock test them. If they still don’t study have them fail the test.
Have students write out the long form responses for homework instead of the diary to save prep time.
of course you may need to edit and upgrade their answers to help them pass

The Test Starts Here
Timer: 0 minute mark
Basic Questions (click to open up)
Date: What is the date today? > must respond & ask the right questions
오늘 날짜가 어떻게 되나요?
오늘 무슨 요일인가요?
시간 & 날짜 (NEW)
7월 20일 / 11월 30일 / 2월 12일 / 4월 15일
지금 몇시인지 아시나요? > 지금 12시 반이에요 (현재 시간으로)
학원 오는데 얼마나 걸리나요? > 한 30분 정도 걸려요 (it takes about half an hour)
미국 언제 갈꺼야? > 8월 7일쯤 갈거야. (i’m gonna go on august 7th)
Greet the teacher: can you say hi to me in 3 different ways? (greetings that are in the “easy” level in the textbook will not count)
how is it going? > it’s going well
how are you doing? > I’m doing well
what’s going on? > nothing special
what’s up? > nothing much
how is everything? > everything is good
is everything going well? > yeah, everything’s good
What’s on your mind? > nothing much (there’s nothing on my mind)
It’s been a while! Long time no see > Yeha it’s been a while! How are you?
Let’s catch up sometime!
Timer: 5 minute mark
Common Questions (ask all)
Hi XX, long time no see, can you introduce yourself? [talking about oneself] [Must memorize an upgraded version]
What are your hobbies nowadays? What are you into? Tell me in detail (Or: tell me about your hobbies in more detail!) [Must memorize upgraded version]
what do you look forward to in your day?
What do you do? (what is your job?) Tell me more about your job & company. [Must memorize upgraded version] (skip if it was mentioned in detail already)
Or : tell me about being a student. How is it? do you wanna grow up faster? (For students)
(There may be follow up questions to test their basic grammar and speed)
Timer: 10 minute mark
Work questions (ask at least 3)
there may be follow up questions
I am looking for any grammar mistakes, the use of advanced grammar, intermediate vocabulary, speed, natural flow
Advanced grammar = Have pp, could, should, relative pronouns, verbal nouns, might
Tell me about a typical day at work
Tell me about your most recent project
What was your previous job?
Why are you taking a break from work?
How are you enjoying taking a break from school / work?
How is being a housewife treating you? (student / an employee)
do you like your company or school? what about your major?
tell me about your team and position?
what do you plan to do for work in your future
do you like school? how is it different from other schools?
do you like your homeroom class?
do you like your homeroom teacher?
are there any professors / managers / coworkers that you like?
Timer: 15 minute mark
Storytelling (ask at least 2) (click to open up)
Must use advanced grammar
Good storytelling = incorporating characters, dialogue, and an entertaining flow. (practice makes perfect)
Tell me about something unexpected that happened recently
Tell me about the most memorable fight or argument you had with someone that you know
Tell me some office gossip. (maybe someone you dislike at work)
Tell me about a situation that annoyed you at work
Tell me about how your kids upset you or made you laugh
Timer: 20 minute mark
Grammar: Verbal Nouns and Relative Pronouns (ask at least 7) (click to open up)
저 여자가 [제가 어제 만난 여자]에요.
[제가 좋아했던 그 여자]가 이사 갔어요.
[제가 만난 그 남자]는 코미디언이었어요.
제가 [당신이 만난 사람]을 봤어요.
[제가 어제 뭘 했는지] 기억이 안 나요.
[그녀가 이게 예쁘다고] 말했어요.
[제가 어릴 때], 저는 아팠어요.
제가 [왜 그녀가 화났는지] 모르겠어요.
제가 [당신이 어디 있는지] 알아요.
그게 [제가 우유를 못 마시는 이유]에요.
제가 [당신이 거짓말한 걸] 알아요.
[제가 예쁘지 않다고] 생각했어요.
제가 [1000원짜리 물]을 샀어요.
[제가 좋아하는 음식]은 피자예요.
[제가 일하는 회사]는 부산에 있어요.
제가 좋아하는 장면은 [주인공이 악당과 싸우는 장면]이에요.
제가 좋아하는 [여자를 만났어요].
[그게 바로 당신을 좋아하는 이유예요].
제가 [포레스트 검프라는 영화]를 봤어요.
저는 [유명한 케이팝 보이그룹인 BTS]를 좋아해요.
나는 그가 내 이름을 기억하는지 궁금해.
나는 네가 여행을 즐겼기를 바라.
그녀는 왜 늦었는지 설명했어.
내가 이걸 제시간에 끝낼 수 있을지 확신이 안 서.
나는 오늘이 그녀의 생일이라는 걸 잊었어.
나는 네가 내일 쉬는 날인 걸 알기 때문에 계획을 세웠어.
그가 쓴 보고서가 이 프로젝트의 핵심 자료야.
그가 언급했던 프로젝트가 드디어 시작됐어.
내가 다니는 헬스장은 24시간 운영해.
그녀가 요리한 음식이 오늘의 메인 요리야.
내가 매일 이용하는 지하철역이 이번 주에 공사 중이야.
Timer: 25 minute mark
Choose 3 of 5 topics to talk about (5 min each)
Movies (ask at least 2) (must use multiple relative pronouns & verbal nouns ) (click to open up)
(or TV shows, Anime, webtoons, books, entertainment shows)
What movie did you watch recently?
What was the story about in detail?
What is your all time favorite movie?
What was the story about in detail?
Why do you like this movie so much?
Ask me 3 questions about my movie taste and recommend a movie for me and explain why you think I would like it
Tell me about your favorite actor or actress and why you like them. What did they come out in?
what TV program did you watch when you were a kid? what is it about?
Talking to a foreigner (click to open up)
Let’s have a conversation. Please ask me about my childhood, where I grew up, and how I came to korea. (refer to the expressions below)


Make the student ask you about 5~10 questions about yourself and your foreign background
Must use at least 5 of the following questions

 The flow of questioning must be natural

 For David


Where did you grow up?
Where in the states did you live?
What state are you from?
Do you miss living in america?
Are you planning to go back anytime soon?
Where do you like living better? Korea or the US?
How long has it been since you lived in the US?
What’s the best part about living in korea? (being back in korea)
Do you speak any other lanugages?
Did you live anywhere else other than the US? (any other countries)
Where did you go to school?
For other teachers (try to memorize this one as well)


Are you teaching full time?
Where did you learn your english? (how to speak english)
how long did you live in ~
How long has it been since you came back to korea?
what brings you back to korea?
Are you staying for good? or are you just visiting for a while?
Where do you prefer living?
What do you miss about your home country?
Have you traveled in other countries as well?
Did you get to travel a lot in korea?
What’s the best part about living in Germany?
How is korea treating you?
What was your job back in California?
Are there any places you recommend to visit back in France?
How many languages do you speak?
How is korea compared to Europe?
How’s the food treating you?
Drinking (ask at least 2)
All answers must incorporate storytelling & advanced grammar
When is the last time that you drank?
Do you drink often?
Tell me about a embarrassing drinking experience (must explain situation well / express why it was embarrassing)
Recommend a pub and explain why you like it
what can I order there? What do they serve?
Ask me 5 drinking questions & have a small conversation with me regarding the topic
The questions cannot all be too easy and must connect like a conversation
Dating (ask at least 2)
All answers must incorporate storytelling & advanced grammar
Tell me about your most recent dating experience
Why didn’t it work out? / How is the relationship going?
What are your thoughts about marriage and kids?
What is your ideal type? Does that person match your ideal type?
Do you have a crush on someone right now? what kind of person are they?
Tell me about your ex (if it’s okay to ask)
Ask me 5 dating questions & have a small conversation with me regarding the topic
The questions cannot all be too easy and must connect like a conversation
Being sick (ask at least 2)
All answers must incorporate storytelling & advanced grammar
Tell me about the last time you were sick. How were you sick and how painful was it? How did you recover?
Tell me about the last time you hurt yourself physically. What happened and how painful was it? How did you deal with it?
Are you stressed nowadays? What are you stressed about? How are you dealing with it?
When is the last time that you went to the hospital?
Ask me 5 questions about being sick or hurt and have a small conversation with me regarding the topic
The questions cannot all be too easy and must connect like a conversation
Timer : 40 minute mark
Intermediate Pillar expressions (ask 20)
가능하면 헬스장에 갈 수도 있어.
이 영화는 해리 포터와 비슷해.
그게 우리가 지난번에 본 거 아니야?
그 영화는 우리가 지난주에 본 거야.
오랜만에 옛 친구와 안부를 나눴어. (근황토크)
한국에서 가장 유명한 레스토랑 중 하나에서 식사했어.
날씨에 따라 달라.
나는 모든 종류의 음악을 좋아하지만, 특히 재즈를 사랑해.
어떻게든 프로젝트를 끝냈어.
프로젝트가 어려웠지만, 그래도 끝냈어.
원래는 해외여행을 계획했지만, 대신 집에 있기로 결정했어.
보통 나는 매일 아침 7시에 일어나.
결론적으로 2가지
결국에는 2가지
드디어 2가지
결과로서
내가 파티에 가지 않은 이유는 일 때문에 너무 지쳤기 때문이야.
내가 고향을 마지막으로 방문한 것은 아주 오래 전이야.
버스를 놓쳤어. 그래서 늦었어.
등산은 힘들었지만, 그만한 가치가 있었어.
개인적으로, 나는 이것이 최선의 선택이라고 생각해.
건강에 좋지 않다는 걸 알지만, 어쩔 수 없어.
150만원은 달러로 얼마야?
그는 나에게 30만원을 빚졌어.
대화가 이상해졌어.
카페에서 전 애인을 만났을 때 어색했어.
이 프로젝트를 통해 그녀를 잘 알게 됐어. (close 아님)
우리는 아직 서로를 알아가는 중이야.
그 영화를 보는 것은 시간 낭비였어.
그 비싼 가방을 사는 것은 돈 낭비였어.
내가 너라면, 매니저와 얘기할 거야.
이것 좀 도와줄 수 있을까?
결국 그 행사에 자원봉사를 하게 됐어.
왠지 그 노래에 대해 계속 생각이 났어.
그녀는 내내 조용했어.
그런데, 장소가 어디였지?
어쩔 수 없어.
어제 소개팅을 가기로 했는데 취소됐어.
그렇게 했어야 했는데.
내가 너라면 그렇게 했을 거야.
결국 시험에 늦었어.
중간고사를 거의 다 끝냈어.
우리 아이들이 잘 어울려서 기뻐.
내가 너라면, 나도 긴장됐을 거야.
왠지 잠을 잘 수 없었어.
대략 5만원 정도 들었어.
빨리 끝내자.
그만한 가치가 있었어! / 그만한 가치가 없었어.
네가 자고 있을 거라고 생각했어.
다이어트 중이라서 체중을 줄이려고 노력 중이야.
지난 2주 동안 체중이 많이 늘었어.
넷플릭스 시리즈의 이 밈이 소셜 미디어에서 바이럴했어.
난 그걸 믿지 않아!
일반적으로, 달리기에서 여자들은 남자들을 따라가지 못해.
행사에 더 일찍 왔어야 했는데! 하지만 교통이 혼잡했어.
낙관적인 / 비관적인
응원할게! / 널 응원해!
얼마나 오래 밖에 있었어?
우리는 서로 그다지 잘 맞지 않아.
우리 사이에 잘 안 될 것 같아.
그게 정말 필요해?
오늘 당직이야 (야간 근무)
어제 우리가 산 것보다 두 배나 비싸 (두 배의 가격)
그냥 안 가면 안 돼?
어떻게 될지 두고 보자!
가야 한다는 압박감을 느꼈어 / 나한테 압박 주지 마!
아무도 그 이유를 몰라.
그가 떠났다는 것도 몰랐어.
왜 그런 거야?
그게 무슨 상관이야?
너에게 부담을 주고 싶지 않아.
그가 안타까웠어.
너의 의견으로는 어떤 게 제일 좋아?
그 돈을 너한테 쓰는 게 낫겠어.
술 마시러 가는 것보다 운동하러 가는 게 낫겠어.
당황한 / 당황스러운
좀 주제에서 벗어나지만...
10명 중 9명은 그렇게 할 거야.
다시 생각해보니, 그 가방을 사지 말았어야 했어.
나는 "프렌즈" TV 쇼에 완전히 빠졌어.
말 끊어서 미안해.
약 먹는 걸 잊었어.
사업은 어떻게 돼가?
부럽다 / 네가 부러워.
내가 말했는지 모르겠네.
너와는 관련이 없어 / 너와는 아무 상관이 없어.
지난 2개월 동안
분위기를 읽어 / 조심스럽게 행동해
짧은 방문인데도 항상 내가 음식값을 내야 해.
나 얘기는 그만하고, 너희 얘기 좀 해봐.
모니터 암이 뭔지 알아?
정신적 붕괴가 왔어.
나 자신에게 매우 실망했어.
네가 나를 사랑하는 한
네가 일만 하면 돼.
내가 아는 바로는
걱정 마, 내가 먼저 연락할게.
최악의 상황이 뭐야?
신기하게도,
나이가 먹을수록 (2가지)
시간이 갈수록
다시 고민중이야
나 FOMO 있어
이거 처음부터 만들었어
너무 신사다 (예의바르다)
그녀는 완벽주의자야
너 편하게 말할 수 있었으면 좋겠어
다른 이야기긴 한데 (3가지)
밤샜다 (2가지)
해볼만해 (2가지)
Answer Key
Intermediate Pillar expressions (ask 20)
I might go to the gym later if I can.
This movie is similar to Harry potter
isn’t that what we watched last time?
The movie is one that we watched last week.
I caught up with an old friend for the first time in a while.
I dined at one of the most famous restaurants in Korea.
It depends on the weather.
I like all kinds of music, but I specifically love jazz.
I finished the project somehow
even though the project was difficult, I finished it (even if)
Originally, I planned to travel abroad, but I decided to stay home instead.
Normally, I wake up at 7 AM every day.
All in all / In conclusion
eventually / In the end
finally / at last
As a result
The reason that I didn’t go to the party was because I was too drained from work.
The last time that I visited my hometown was ages ago.
I missed the bus. That’s why I was late.
The hike was tough, but it was worth it.
Personally, I think this is the best option.
I know it’s unhealthy, but I can’t help it.
How much is 1,500,000 won in dollars?
He owes me 300,000 won.
The conversation got weird.
It felt awkward when I met my ex at the café.
I got to know her well through this project.
we’re still getting to know each other
Watching that movie was a waste of time.
Buying that expensive bag was a waste of money.
If I were you, I would talk to the manager.
Would you mind helping me with this?
I ended up volunteering for the event.
For some reason, I couldn’t stop thinking about that song.
She was quiet for the whole time.
By the way, where is the venue again?
I can’t help it
I was supposed to go on a blind date yesterday but it got canceled
I should’ve {~했었어야 했다}
I would’ve {나라면 ~를 했을 것이다}
I ended up being late to the test
I’m pretty much done with my midterms
I’m glad that our kids got along
if I were you, I would be nervous too
I couldn’t sleep for some reason
it cost roughly 50,000won
let’s get it over with
it was worth it! / it wasn’t worth it
I figured that you were sleeping
I’m trying to lose weight because I’m on a diet.
I gained a lot of weight over the last 2 weeks.
this meme from a netflix series went viral on social media. (it blew up)
I don’t buy it!
generally, girls can’t keep up with guys when running
I should’ve come to the event earlier! but the traffic was heavy.
optimistic / pessimistic
I’m cheering for you! / I’m rooting for you!
how long did you stay out?
we’re not that compatible with each other
it’s not gonna work out between us
is that even neccesary?
I’m on duty today (the night shift)
it’s twice as expensive as the one we bought yesterday (twice the price)
why can’t we just not go?
we’ll see how it goes!
I felt pressured to go / stop pressuring me!
no one knows why
I didn’t even know that he left
why is that the case?
what does that have to do with anything?
I don’t want to burden you
I felt bad for him
In your opinion, which one is the best?
I would rather spend that money on you
I would rather go work out than go drink
embarrassed / embarrassing
this is kind of a tangent but ..
9 out of 10 people would do that
on second thought, I should’ve never bought that bag
I’m totally obsessed with the TV show “friends”
sorry to cut you off
I forgot to take my medicine
how is your business going?
I'm jealous / I envy you
I'm not sure if I told you
it’s not related with / it doesn’t have anything to do with you
for the last 2 months
read the room / walk on eggshells
I always have to pay for food even though it’s a short visit.
enough about me, tell me about you guys
do you know what a monitor arm is?
I had a mental breakdown
I was very disappointed in myself
as long as you love me
as long as you do your work, it’s all good
from what I know
don’t worry, I’ll reach out first
what’s the worst case scenario?
interestingly enough,
As I get older / the older I get
As time goes by
I’m having second thoughts
I have FOMO (fear of missing out)
we made this from scratch
he’s such a gentleman
she’s a perfectionist
I want to be able to say it more comfortably
that was a tangent / that was off topic / we sidetracked a bit
I pulled an all nighter / I stayed up all night
it's worth a try
Pillar Vocab (ask 10)
보아하니 / 듣자 하니


엄밀히 말하면 / 기술적으로


협상하다


정착하다 / 자리 잡다


재무 감사


은퇴하다


동시에


까다로운


주식과 채권에 투자하다


고려하다 / 생각하다


~을 언급하다 / ~을 참조하다


~에 관하여 / ~와 관련하여


회의적인


피해망상적인 / 과민한


자극하다


유능한 직원


시간을 잘 지키는 / 시간 엄수하는


정치


욕설 / 욕하기


총각 파티 / 신부 파티 (결혼 전 파티)


스트리퍼들 (춤추는 사람들)


장소 / 개최지


의무적인 / 필수의


무언가가 유행하고 있다


망설이고 있어요


편리한


직설적인 / 솔직한


숙소 / 숙박 시설


다과 / 음료수들


야망 있는 / 포부가 큰


느긋한 / 여유로운 (혹은 "진정해"라는 표현으로도 사용)


기진맥진한 / 매우 지친


꽃뱀들 (돈만 노리는 사람들)


일생에 한 번뿐인 기회


귀걸이 / 목걸이 / 팔찌들


치아 교정기 (브레이스)


치실 (플로스)


섬세하고 배려심 있는


존중하는 / 예의 있는


오글거리는 / 민망한


증명하다 / 승인(허가)하다


선거에서 투표하다


장례식


공통 친구들


~을 이용하다 (부정적 뉘앙스 포함 가능)


병가를 내다 (아프다고 연락하다)


집착하는 / 푹 빠진


첫째로 / 둘째로


직설적인 / 솔직한


Vocab (ask 10) > make fun phrases chapter
apparently,
technically,
negotiate
settle down
financial audit
retire
simultaneously
picky
invest in stocks and bonds
consider
refer to
regarding ~
skeptical
paranoid(delete?)
stimulate
a competent employee
punctual
politics
swearing / cussing / cursing
bachelor party / bridal shower
strippers
venue
mandatory
something is trending
i’m hesitating
convenient
straightforward / direct
accommodation
refreshments / beverages
ambitious
chill
exhausted
gold diggers
once in a lifetime opportunity
earrings / necklaces / bracelets
braces
floss
sensitive and caring
respectful
cringy
prove / approval
vote for the election
funeral
mutual friends
take advantage of
call in sick
obsessed
first of all / second of all
straightforward
End Timer: 45 minute mark (15 minutes left for feedback)
`,

};

function TestPage() {
  const [note, setNote] = useState<NoteData | null>(null);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const searchParams = useSearchParams();
  const studentName = searchParams.get('student_name') || 'Unknown Student';

  const handleSelect = async (title: string) => {
    const query = new URLSearchParams({ studentName, title });
    const res = await fetch(`/api/test?${query.toString()}`);
    let data;
  
    if (res.ok) {
      data = await res.json();
    } else {
      // Create fallback template and save to DB
      const fallback = {
        student_name: studentName,
        title,
        text: templates[title] || '',
      };
  
      const postRes = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fallback),
      });
  
      if (postRes.ok) {
        data = fallback;
      } else {
        alert('Failed to create test entry.');
        return;
      }
    }
  
    setNote(data);
    setText(data.text || '');
  };
  

  const handleSave = async () => {
    if (!note) return;
    setSaving(true);

    const res = await fetch('/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...note, text }),
    });

    if (res.ok) alert('Saved!');
    else alert('Save failed');

    setSaving(false);
  };

  const renderButtons = (level: 'Beginner' | 'Intermediate') => (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-gray-800">{level}</h3>
      {Object.keys(templates)
        .filter((key) => key.startsWith(level))
        .map((title) => (
          <button
            key={title}
            onClick={() => handleSelect(title)}
            className="block w-full text-left bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md text-gray-800"
          >
            {title.replace(`${level}: `, '')}
          </button>
        ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow">
        <h2 className="text-2xl font-bold mb-6 text-[#191f28]">
          {note ? note.title : `${studentName}'s Test Materials`}
        </h2>

        {!note ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {renderButtons('Beginner')}
            {renderButtons('Intermediate')}
          </div>
        ) : (
          <>
            <textarea
              className="w-full min-h-[480px] p-4 border rounded-lg bg-white text-black"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button
              onClick={handleSave}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-xl"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function PageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TestPage />
    </Suspense>
  );
}


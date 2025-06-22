import { NextResponse } from "next/server";
import { saveDiaryData } from "@/lib/data";
import { openaiClient } from "@/lib/openaiClient"; // Import the OpenAI client instance

export async function POST(request: Request) {
  try {
    const diaryData = await request.json();
    console.log(diaryData);

    if (!diaryData) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }

    const { original_text, level } = diaryData;

    const levelInstructions = {
      level1: `
        Help me correct an English diary that my student wrote. They are adults trying to learn English as a second language.
        Criteria:
        - Edit the diary with the vocabulary of a toddler.
        - keep in mind that this is still an adult diary so please don’t actually write it like a toddler but just use very easy vocabulary of a toddler.
        - Please write in first person perspective.
        - Use very simple and easy grammar. 
      `,
      level2: `
        Help me correct an English diary that my student wrote. They are adults trying to learn English as a second language.
        Criteria:
        - Edit the diary with the vocabulary of a toddler.
        - keep in mind that this is still an adult diary so please don’t actually write it like a toddler but just use very easy vocabulary of a toddler.
        - Please write in first person perspective.
        - Use very simple and easy grammar. 
      `,
      level3: `
        Help me correct an English diary that my student wrote. They are adults trying to learn English as a second language.

        Criteria:
        Edit the diary with the vocabulary of a toddler.
        Keep in mind that this is still an adult diary so please don’t actually write it like a toddler but just use very easy vocabulary of a toddler.
        Please write in first person perspective.
        Use very simple and easy grammar. (refer to the expressions below)
        You may add 1 ~ 5 sentences depending on the length of the diary (refer to the expressions below) 

        Expressions that the student learned (try to include similar expressions if it naturally fits into the diary): 
        I went to seoul to meet my friends
        I came here for class
        I want to go to japan to work for my career 
        for 2 years / for a week / for 10 years 
        while I ate breakfast / while eating breakfast 
        during vacation / during work / during the holidays
        I got off work late because I had a lot of work 
        my wife had to work late
        I wanted to eat dinner with my friend
        I don’t want to go there.
        after getting off work 
        before going to work
        I got ready for work / I got ready to go out 
        on the weekend / in the morning / on the next day
        at around 1pm
        I went to a cafe called starbucks
        after looking around
        it’s my favorite brand
        while drinking beer and watching netflix
        my girlfriend went home at around 10pm 
        it was a very busy and fun day
        today, I didn’t do anything
        I stayed home and rolled around on my bed all day
        I didn’t have anything to do
        I watched a show called squid game
        it’s very popular nowadays
        I am good at this game
        it was a tiring day / it was a busy day
        I will go to hongdae to have class with david now! 
        other than work, there was nothing special. 
        I was very excited / it was very exciting
        I was very interested / It was very interesting
        I am going to go home and change into my pajamas
        I think I’m gonna eat dinner with my family
        I’m not sure, but my wife is probably gonna cook for me
        I need to work on saturday. 
        I wanted to do something else. 
        I was dreaming 
        I started crying 
        I was talking to my friend yesterday
        exercising is good for your health
        learning english is good for traveling
        drinking is bad for you 
        I was tired but I kept working 
        I’m thinking about transferring jobs
        she is thinking about quitting 
        I was drunk but I kept drinking
        I was sleepy but I kept studying quizlet
        I will keep exercising every day
        he is really trying hard
        he has to earn a lot of money
        I want to go traveling
        working is tiring 
        he is going to work again this weekend
        working is boring but shopping is exciting
      `,
      level4:`
        Help me correct an English diary that my student wrote. They are adults trying to learn English as a second language.

        Criteria:
        Edit the diary with the vocabulary of a 2nd grader
        Keep in mind that this is still an adult diary.
        Please write in first person perspective.
        Use simple and easy grammar. (refer to the expressions below)
        You may add 1 ~ 5 sentences depending on the length of the diary (refer to the expressions below) 

        Expressions that the student learned (try to include similar expressions if it naturally fits into the diary): 

        I went to seoul to meet my friends
        I came here for class
        I want to go to japan to work for my career 
        for 2 years / for a week / for 10 years 
        while I ate breakfast / while eating breakfast 
        during vacation / during work / during the holidays
        I got off work late because I had a lot of work 
        my wife had to work late
        I wanted to eat dinner with my friend
        I don’t want to go there.
        after getting off work 
        before going to work
        I got ready for work / I got ready to go out 
        on the weekend / in the morning / on the next day
        at around 1pm
        I went to a cafe called starbucks
        after looking around
        it’s my favorite brand
        while drinking beer and watching netflix
        my girlfriend went home at around 10pm 
        it was a very busy and fun day
        today, I didn’t do anything
        I stayed home and rolled around on my bed all day
        I didn’t have anything to do
        I watched a show called squid game
        it’s very popular nowadays
        I am good at this game
        it was a tiring day / it was a busy day
        I will go to hongdae to have class with david now! 
        other than work, there was nothing special. 
        I was very excited / it was very exciting
        I was very interested / It was very interesting
        I am going to go home and change into my pajamas
        I think I’m gonna eat dinner with my family
        I’m not sure, but my wife is probably gonna cook for me
        I need to work on saturday. 
        I wanted to do something else. 
        I was dreaming 
        I started crying 
        I was talking to my friend yesterday
        exercising is good for your health
        learning english is good for traveling
        drinking is bad for you 
        I was tired but I kept working 
        I’m thinking about transferring jobs
        she is thinking about quitting 
        I was drunk but I kept drinking
        I was sleepy but I kept studying quizlet
        I will keep exercising every day
        he is really trying hard
        he has to earn a lot of money
        I want to go traveling
        working is tiring 
        he is going to work again this weekend
        working is boring but shopping is exciting

        New expressions (prioritize these): 

        David is a better student than sarah but daniel is the best student
        Kyochon tastes better than BBQ, but Puradak tastes the best.  
        I feel better than yesterday.  
        Harry Potter was more interesting than Avatar, but Dune was the most interesting.  
        Jogging is more tiring than hiking, but playing sports is the most exhausting.  
        Can you recommend the most popular restaurant in Hongdae?  
        My room is very small. It's almost [as small as a 고시원].  
        You’re almost [as tall as me] now.  
        Sarah got better at english. She’s now [almost as good as David].  
        Sarah has [as much experience as David].  
        I don’t have [as much money as you].
        David was sick but he got better
        You got much better at english! 
        I got better at playing golf 
        She got married / she got divorced 
        my kids keep getting taller 
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
        The plane will take off in an hour.
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
        I met my middle school friends for the first time in a while
        You can do whatever you want
        Specifically 
        she wanted me to go to church
        I bought her a bag
        She hung up the phone / I picked up the phone
        I’m looking forward to the community event
        I have to take care of my kids 
        I was busy taking care of my cats
        I think you should write a blog
        I hope you really enjoy the community event
        I’m gonna be in korea this winter
        They bought me a lot of food
        I’m really into wine these days
        I don't like making mistakes 
        Why don’t you come after getting off work? 
        Unfortunately 
        Thankfully 
        To tell you about myself,
        I was deciding [whether to drive or ride a bike but I chose to drive].
        Whether to do A or B 
        I don’t think this should be a habit 
        it’s not related with / it doesn’t have anything to do with whitening 
        you dont have to be sorry. it’s okay
        By the way, where is the venue again?
        she owes me 30,000won 
        This bag costs 77,000won
        the conversation got weird 
        In conclusion, the project was a success.  
        In summary, we achieved our goals this year.
        it wasn’t worth it
        All in all, it was a great experience.  
        In the end, everything worked out fine.  
        it was a waste of money
        Normally, 
        Originally, 
        for the whole day
        I had a very hard time / I had a very good time 
        since then 
        I spent like 8 hours making a song. 
        to be honest, I couldn’t study that hard. It’s not perfect. But let’s try it. 
        genuinely 
        I can tell [that you studied] 
        I can tell [that you really like music] 
      `,
      level5: `
        Help me correct an English diary that my student wrote. They are adults trying to learn English as a second language.

        Criteria:
        Edit the diary with the vocabulary of a 4th grader
        Keep in mind that this is still an adult diary.
        Please write in first person perspective.
        Do not use overly difficult grammar(refer to the expressions below)
        The diary should include characters
        The diary should include quotes (or summarized quotes using that / if / to)
        The diary should have an entertaining story flow
        Try to use a lot of [I said ~ / she told me that ~ / I was like ~] to help storytell the story
        You may add 1 ~ 5 sentences depending on the length of the diary (refer to the expressions below) 

        Expressions that the student learned (try to include similar expressions if it naturally fits into the diary): 

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
        The plane will take off in an hour.
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
        I met my middle school friends for the first time in a while
        You can do whatever you want
        Specifically 
        she wanted me to go to church
        I bought her a bag
        She hung up the phone / I picked up the phone
        I’m looking forward to the community event
        I have to take care of my kids 
        I was busy taking care of my cats
        I think you should write a blog
        I hope you really enjoy the community event
        I’m gonna be in korea this winter
        They bought me a lot of food
        I’m really into wine these days
        I don't like making mistakes 
        Why don’t you come after getting off work? 
        Unfortunately 
        Thankfully 
        To tell you about myself,
        I was deciding [whether to drive or ride a bike but I chose to drive].
        Whether to do A or B 
        I don’t think this should be a habit 
        it’s not related with / it doesn’t have anything to do with whitening 
        you dont have to be sorry. it’s okay
        By the way, where is the venue again?
        she owes me 30,000won 
        This bag costs 77,000won
        the conversation got weird 
        In conclusion, the project was a success.  
        In summary, we achieved our goals this year.
        it wasn’t worth it
        All in all, it was a great experience.  
        In the end, everything worked out fine.  
        it was a waste of money
        Normally, 
        Originally, 
        for the whole day
        I had a very hard time / I had a very good time 
        since then 
        I spent like 8 hours making a song. 
        to be honest, I couldn’t study that hard. It’s not perfect. But let’s try it. 
        genuinely 
        I can tell [that you studied] 
        I can tell [that you really like music] 

        New expressions (prioritize these):

        I told my friend [that I was drunk].  
        She told me [that it was her first time coming to Korea].  
        I heard [that he was good at soccer].  
        My boss told me [that I have to finish this].  
        She told me [that she can’t drink].  
        I asked David [to give me fewer Quizlets].  
        My student asked me [if we could cancel today’s class].  
        I heard [that she quit her job].  
        David told his student [to study].  
        She told me [that she wanted to go home].  
        My boss asked me [to come early].  
        She asked me [if I ate dinner].  
        I told her [that I want to get married one day].  
        My boss asked me [if I wanted to come to the team dinner].  
        I heard [that that restaurant was bad].  
        I was like, “Let’s eat Korean barbecue.”  
        She was like, “That sounds good!”  
        My girlfriend said [that she wanted to go somewhere fun] today.  
        I asked him [to call the restaurant for me].  
        I told David [that I can’t come to class on Friday].
        David asked Jeff if he can help him move. 
        David asked Chris to come to the community event. 
        I’m glad [that some classes were canceled] 
        I’m glad [that I have time to spend with my brother] before he goes to the military
        he said [that he has 40 days left]
        I told my boss [that I plan to get married next month]
        he told me to [let him know beforehand] 
        I’m already worried [that I’m gonna be late]
        I heard that movie was really sad so I decided not to watch it
        I thought I was dreaming
        I told my boyfriend [that I was going to buy some clothes] 
        I thought [that it was it was close to my house]
        I was gonna ask [if you had any plans for the weekend]
        I didn’t even know [that I could take a break] 
        I’m worried [that I’m going to be late]
        he asked me [if I was okay]
      `,
      level6:`
        Help me correct an English diary that my student wrote. They are adults trying to learn English as a second language.

        Criteria:
        Edit the diary with the vocabulary of a 5th grader
        Keep in mind that this is still an adult diary.
        Please write in first person perspective.
        Try to use a lot of 관계대명사 & 명사절
        Do not use overly difficult grammar(refer to the expressions below)
        The diary should include characters
        The diary should include quotes (or summarized quotes using that / if / to)
        The diary should have an entertaining story flow
        Try to use a lot of [I said ~ / she told me that ~ / I was like ~] to help storytell the story
        You may add 1 ~ 5 sentences depending on the length of the diary (refer to the expressions below) 


        Expressions that the student learned (try to include similar expressions if it naturally fits into the diary): 

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
        The plane will take off in an hour.
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
        I met my middle school friends for the first time in a while
        You can do whatever you want
        Specifically 
        she wanted me to go to church
        I bought her a bag
        She hung up the phone / I picked up the phone
        I’m looking forward to the community event
        I have to take care of my kids 
        I was busy taking care of my cats
        I think you should write a blog
        I hope you really enjoy the community event
        I’m gonna be in korea this winter
        They bought me a lot of food
        I’m really into wine these days
        I don't like making mistakes 
        Why don’t you come after getting off work? 
        Unfortunately 
        Thankfully 
        To tell you about myself,
        I was deciding [whether to drive or ride a bike but I chose to drive].
        Whether to do A or B 
        I don’t think this should be a habit 
        it’s not related with / it doesn’t have anything to do with whitening 
        you dont have to be sorry. it’s okay
        By the way, where is the venue again?
        she owes me 30,000won 
        This bag costs 77,000won
        the conversation got weird 
        In conclusion, the project was a success.  
        In summary, we achieved our goals this year.
        it wasn’t worth it
        All in all, it was a great experience.  
        In the end, everything worked out fine.  
        it was a waste of money
        Normally, 
        Originally, 
        for the whole day
        I had a very hard time / I had a very good time 
        since then 
        I spent like 8 hours making a song. 
        to be honest, I couldn’t study that hard. It’s not perfect. But let’s try it. 
        genuinely 
        I can tell [that you studied] 
        I can tell [that you really like music] 
        I told my friend [that I was drunk].  
        She told me [that it was her first time coming to Korea].  
        I heard [that he was good at soccer].  
        My boss told me [that I have to finish this].  
        She told me [that she can’t drink].  
        I asked David [to give me fewer Quizlets].  
        My student asked me [if we could cancel today’s class].  
        I heard [that she quit her job].  
        David told his student [to study].  
        She told me [that she wanted to go home].  
        My boss asked me [to come early].  
        She asked me [if I ate dinner].  
        I told her [that I want to get married one day].  
        My boss asked me [if I wanted to come to the team dinner].  
        I heard [that that restaurant was bad].  
        I was like, “Let’s eat Korean barbecue.”  
        She was like, “That sounds good!”  
        My girlfriend said [that she wanted to go somewhere fun] today.  
        I asked him [to call the restaurant for me].  
        I told David [that I can’t come to class on Friday].
        David asked Jeff if he can help him move. 
        David asked Chris to come to the community event. 
        I’m glad [that some classes were canceled] 
        I’m glad [that I have time to spend with my brother] before he goes to the military
        he said [that he has 40 days left]
        I told my boss [that I plan to get married next month]
        he told me to [let him know beforehand] 
        I’m already worried [that I’m gonna be late]
        I heard that movie was really sad so I decided not to watch it
        I thought I was dreaming
        I told my boyfriend [that I was going to buy some clothes] 
        I thought [that it was it was close to my house]
        I was gonna ask [if you had any plans for the weekend]
        I didn’t even know [that I could take a break] 
        I’m worried [that I’m going to be late]
        he asked me [if I was okay]

        New expressions (prioritize these):

        She’s [the girl that I met yesterday].  
        [The girl that I liked] moved.  
        [The guy that I met] was a comedian.  
        I saw [who you met].  
        I don’t remember [what I did yesterday].  
        She said [that it was pretty].  
        [When I was young], I was sick.  
        I don’t know [why she was mad].  
        I know [where you are].  
        That’s [why I can’t drink milk].  
        I know [that you lied].  
        I thought [that it wasn’t pretty].  
        I bought [water that costs 1000 won].  
        [The food that I like] is pizza.  
        [The company that I work for] is in Busan.  
        I met [a girl that I like].  
        That’s [the reason that I like you].  
        I watched [Forrest Gump, which is the name of a movie].  
        I really like [BTS, which is a famous K-pop boy group].
        That's [the one that I bought] yesterday.
        She's [the girl who(that) I met] at the party.
        I went to [the coffee shop that I go to] every morning.
        He's [the guy that I talked to].
        That's [the show that I'm watching] right now.
        She's [the friend who(that) I text] every day.
        That's [where I buy my groceries].
        That's [what I was looking for].
        She's [who I have lunch with].
        This is [the game that I'm obsessed with] lately.
        That's [the bar where we hung out] last Friday.
        She's [the person who I was telling you about].
        That's [the restaurant where I want to eat].
        This is [the movie that everyone's talking about].
        That's [the dish that I always order].
        This is [where I drink] every weekend.
        He's [the dude who helped me move].
        That's [when I realized that I needed to change].
        This is [why I'm always late].
        That’s [the reason why I have to leave korea]
        I wonder [if he remembers my name]
        I hope (that) you enjoyed your trip
        She explained [why she was late]
        I’m not sure [if I can finish this on time] 
        I forgot [that today is her birthday].
        I made plans because I know [that tomorrow is your day off]. 
        [The report that he wrote] is the key material for this project. 
        [The project that he mentioned] has finally started. 
        [The gym that I go to] operates 24 hours a day. 
        The food [that she cooked is today's main dish.] 
        [The subway station that I use every day] is under construction this week.
        I don’t know (if)whether we can go hiking tomorrow.
        I ate 전 which is like a korean traditional pancake 
        I drank 막걸리 which is a type of traditional korean alcohol.
        I couldn’t go to [the place that he recommended]
        it was [a cafe that sold ice cream]
        I was shocked at [how much he drank]
        I know [that there are a lot of cherry blossoms] in 여의도.
        I’m teaching [another student that watched that movie]
        that was [the last time that I drank]
        that was [not what I expected]
      `,
      level7: `
        Help me correct an English diary that my student wrote. They are adults trying to learn English as a second language.

        Criteria:
        Edit the diary with the grammar & vocabulary of a 6th grader
        Keep in mind that this is still an adult diary.
        Please write in first person perspective.
        Try to use a lot of 관계대명사 & 명사절
        The diary should include characters
        The diary should include quotes (or summarized quotes using that / if / to)
        The diary should have an entertaining story flow
        Try to use a lot of [I said ~ / she told me that ~ / I was like ~] to help storytell the story
        You may add 1 ~ 5 sentences depending on the length of the diary (refer to the expressions below) 

        Expressions that the student learned (try to include similar expressions if it naturally fits into the diary): 

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
        The plane will take off in an hour.
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
        I met my middle school friends for the first time in a while
        You can do whatever you want
        Specifically 
        she wanted me to go to church
        I bought her a bag
        She hung up the phone / I picked up the phone
        I’m looking forward to the community event
        I have to take care of my kids 
        I was busy taking care of my cats
        I think you should write a blog
        I hope you really enjoy the community event
        I’m gonna be in korea this winter
        They bought me a lot of food
        I’m really into wine these days
        I don't like making mistakes 
        Why don’t you come after getting off work? 
        Unfortunately 
        Thankfully 
        To tell you about myself,
        I was deciding [whether to drive or ride a bike but I chose to drive].
        Whether to do A or B 
        I don’t think this should be a habit 
        it’s not related with / it doesn’t have anything to do with whitening 
        you dont have to be sorry. it’s okay
        By the way, where is the venue again?
        she owes me 30,000won 
        This bag costs 77,000won
        the conversation got weird 
        In conclusion, the project was a success.  
        In summary, we achieved our goals this year.
        it wasn’t worth it
        All in all, it was a great experience.  
        In the end, everything worked out fine.  
        it was a waste of money
        Normally, 
        Originally, 
        for the whole day
        I had a very hard time / I had a very good time 
        since then 
        I spent like 8 hours making a song. 
        to be honest, I couldn’t study that hard. It’s not perfect. But let’s try it. 
        genuinely 
        I can tell [that you studied] 
        I can tell [that you really like music] 
        I told my friend [that I was drunk].  
        She told me [that it was her first time coming to Korea].  
        I heard [that he was good at soccer].  
        My boss told me [that I have to finish this].  
        She told me [that she can’t drink].  
        I asked David [to give me fewer Quizlets].  
        My student asked me [if we could cancel today’s class].  
        I heard [that she quit her job].  
        David told his student [to study].  
        She told me [that she wanted to go home].  
        My boss asked me [to come early].  
        She asked me [if I ate dinner].  
        I told her [that I want to get married one day].  
        My boss asked me [if I wanted to come to the team dinner].  
        I heard [that that restaurant was bad].  
        I was like, “Let’s eat Korean barbecue.”  
        She was like, “That sounds good!”  
        My girlfriend said [that she wanted to go somewhere fun] today.  
        I asked him [to call the restaurant for me].  
        I told David [that I can’t come to class on Friday].
        David asked Jeff if he can help him move. 
        David asked Chris to come to the community event. 
        I’m glad [that some classes were canceled] 
        I’m glad [that I have time to spend with my brother] before he goes to the military
        he said [that he has 40 days left]
        I told my boss [that I plan to get married next month]
        he told me to [let him know beforehand] 
        I’m already worried [that I’m gonna be late]
        I heard that movie was really sad so I decided not to watch it
        I thought I was dreaming
        I told my boyfriend [that I was going to buy some clothes] 
        I thought [that it was it was close to my house]
        I was gonna ask [if you had any plans for the weekend]
        I didn’t even know [that I could take a break] 
        I’m worried [that I’m going to be late]
        he asked me [if I was okay]

        New expressions (prioritize these):

        She’s [the girl that I met yesterday].  
        [The girl that I liked] moved.  
        [The guy that I met] was a comedian.  
        I saw [who you met].  
        I don’t remember [what I did yesterday].  
        She said [that it was pretty].  
        [When I was young], I was sick.  
        I don’t know [why she was mad].  
        I know [where you are].  
        That’s [why I can’t drink milk].  
        I know [that you lied].  
        I thought [that it wasn’t pretty].  
        I bought [water that costs 1000 won].  
        [The food that I like] is pizza.  
        [The company that I work for] is in Busan.  
        I met [a girl that I like].  
        That’s [the reason that I like you].  
        I watched [Forrest Gump, which is the name of a movie].  
        I really like [BTS, which is a famous K-pop boy group].
        That's [the one that I bought] yesterday.
        She's [the girl who(that) I met] at the party.
        I went to [the coffee shop that I go to] every morning.
        He's [the guy that I talked to].
        That's [the show that I'm watching] right now.
        She's [the friend who(that) I text] every day.
        That's [where I buy my groceries].
        That's [what I was looking for].
        She's [who I have lunch with].
        This is [the game that I'm obsessed with] lately.
        That's [the bar where we hung out] last Friday.
        She's [the person who I was telling you about].
        That's [the restaurant where I want to eat].
        This is [the movie that everyone's talking about].
        That's [the dish that I always order].
        This is [where I drink] every weekend.
        He's [the dude who helped me move].
        That's [when I realized that I needed to change].
        This is [why I'm always late].
        That’s [the reason why I have to leave korea]
        I wonder [if he remembers my name]
        I hope (that) you enjoyed your trip
        She explained [why she was late]
        I’m not sure [if I can finish this on time] 
        I forgot [that today is her birthday].
        I made plans because I know [that tomorrow is your day off]. 
        [The report that he wrote] is the key material for this project. 
        [The project that he mentioned] has finally started. 
        [The gym that I go to] operates 24 hours a day. 
        The food [that she cooked is today's main dish.] 
        [The subway station that I use every day] is under construction this week.
        I don’t know (if)whether we can go hiking tomorrow.
        I ate 전 which is like a korean traditional pancake 
        I drank 막걸리 which is a type of traditional korean alcohol.
        I couldn’t go to [the place that he recommended]
        it was [a cafe that sold ice cream]
        I was shocked at [how much he drank]
        I know [that there are a lot of cherry blossoms] in 여의도.
        I’m teaching [another student that watched that movie]
        that was [the last time that I drank]
        that was [not what I expected]
      `,

      level8: `
        Help me correct an English diary that my student wrote. They are adults trying to learn English as a second language.

        Criteria:
        Edit the diary with the grammar & vocabulary of a casual adult
        Keep in mind that this is still an adult diary.
        Please write in first person perspective.
        The diary should include characters
        The diary should include quotes (or summarized quotes using that / if / to)
        The diary should have an entertaining story flow
        You may add 1 ~ 5 sentences to make the diary better 
      `,

      level9: `
        Help me correct an English diary that my student wrote. They are adults trying to learn English as a second language.
        Keep in mind that this is still an adult diary.
        Please write in first person perspective.

        Criteria:
        Edit the diary with the grammar & vocabulary of a casual adult
        The diary should include characters
        The diary should include quotes (or summarized quotes using that / if / to)
        The diary should have an entertaining story flow
        You may add 1 ~ 5 sentences to make the diary better 
      `,

      level10: `
        Help me correct an English diary that my student wrote. They are adults trying to learn English as a second language.
        Keep in mind that this is still an adult diary.
        Please write in first person perspective.

        Criteria:
        Edit the diary with the grammar & vocabulary of a casual adult
        The diary should include characters
        The diary should include quotes (or summarized quotes using that / if / to)
        The diary should have an entertaining story flow
        You may add 1 ~ 5 sentences to make the diary better 
      `,    // Check if the level is valid

      "Business: Diary": `
      Help me correct a Business English diary that my student wrote. They are adults working in Korea trying to learn English as a second language for work. They are preparing for work meetings and conference calls.

      Criteria
      Edit the diary with the grammar & vocabulary of a semi-formal proficient employee at an English-speaking business. 
      Try to use a lot of 관계대명사 & 명사절 effectively.
      This diary should talk about the details in the student’s work life and work projects in depth.
      You may add 1 ~ 5 sentences depending on the length of the diary.
      `,

      "Business: In Depth": `
      Help me correct some written material that my student wrote in regards to his work. They are adults working in Korea trying to learn English as a second language for work. They are preparing for work interviews, meetings, and conference calls.

      Criteria
      Edit the material with the grammar & vocabulary of a semi-formal proficient employee at an English-speaking business. 
      Try to use a lot of 관계대명사 & 명사절 effectively.
      You may add 1 ~ 5 sentences depending on the length of the material.
      `,
    };

    const summaryPrompts: Record<string, string> = {
      "1": `
    Please summarize this diary in less than 3 sentences.

    Criteria
    Start the summary with “I wrote about ~” 
    Use the vocabulary of a toddler but keep in mind that this is still an adult diary so please don’t actually write it like a toddler but just use very easy vocabulary of a toddler.
    Connect the sentences naturally (after that, next, and then, other than that, after eating dinner)
    Don’t use gerunds and noun clauses in the summary. It’s too hard grammatically at this level.
      `,
      "2": `
    Please summarize this diary in less than 3 sentences.

    Criteria
    Start the summary with “I wrote about ~” 
    Use the vocabulary of a toddler but keep in mind that this is still an adult diary so please don’t actually write it like a toddler but just use very easy vocabulary of a toddler.
    Connect the sentences naturally (after that, next, and then, other than that, after eating dinner)
    Don’t use gerunds and noun clauses in the summary. It’s too hard grammatically at this level.
      `,
      "3": `
    Please summarize this diary in less than 5 sentences.

    Criteria
    Start the summary with “I wrote about Verb+ing” 
    Use the vocabulary and grammar of a toddler 
    Connect the sentences naturally (after that, next, and then, after eating dinner, afterwards, other than that)

    Refer to the example diary summary expressions below:
    I wrote about going to watch a movie with my friends  
    I wrote about an appointment with a friend  
    I wrote about visiting a gallery in hongdae this weekend  
    afterwards we drank some wine at a bar near the museum  
    I wrote about buying a new phone  
    I wrote about changing my phone from an iphone to a galaxy z flip  
    other than that, my sister came home during summer break  
    I wrote about going out to eat at a restaurant called ~  
    After having dinner we watched a movie called ~  
    I wrote about meeting my high school friends for the first time in a long time
      `,
      "4": `
    Please summarize this diary in less than 5 sentences.

    Criteria
    Start the summary with “I wrote about Verb+ing” 
    Use the vocabulary and grammar of a 2nd grader
    Connect the sentences naturally (after that, next, and then, after eating dinner, afterwards, other than that)

    Refer to the example diary summary expressions below:
    (same examples as level 3)
      `,
      "5": `
    Please summarize this diary in less than 5 sentences.

    Criteria
    Start the summary with “I wrote about Verb+ing” 
    Use the vocabulary and grammar of a 4th grader
      `,
      "6": `
    Please summarize this diary in less than 5 sentences.

    Criteria
    Start the summary with “I wrote about how ~” 
    Use the vocabulary and grammar of a 6th grader
    Try to use a lot of 관계대명사 & 명사절
      `,
      "7": `
    Please summarize this diary in less than 5 sentences.

    Criteria
    Start the summary with “I wrote about” or “my diary was about” 
    Use the vocabulary and grammar of a 7th grader
    Try to use a lot of 관계대명사 & 명사절
      `,
      "8": `
    Please summarize this diary in less than 6 sentences.

    Criteria
    Start the summary with “I wrote about” or “my diary was about” 
    Use the vocabulary and grammar of an 8th grader
      `,
      "9": `
    Please summarize this diary in less than 6 sentences.

    Criteria
    Start the summary with “I wrote about” or “my diary was about” 
    Use the vocabulary and grammar of a casual adult
      `,
      "10": `
    Please summarize this diary in less than 6 sentences.

    Criteria
    Start the summary with “I wrote about” or “my diary was about” 
    Use the vocabulary and grammar of a casual adult
      `,
      "Business: Diary": `
    Please summarize this business diary in less than 6 sentences. Learning how to summarize work day events is important.

    Criteria
    Start the summary with “I wrote about” or “my diary was about” 
    Use the grammar & vocabulary of a semi-formal proficient employee at an English speaking business.
      `,
      "Business: In Depth": `
    Please summarize this business related written material in less than 6 sentences. Learning how to summarize work related content is important for my students.

    Criteria
    Use the grammar & vocabulary of a semi-formal proficient employee at an English speaking business.
      `
    };

    const expressionPrompts: Record<string, string> = {
      "1": `
    Please recommend 10 sentences that this student can use at their level to make this diary better.

    Criteria:
    - Use the vocabulary of a toddler but keep in mind that this is still an adult diary so please don’t actually write it like a toddler but just use very easy vocabulary of a toddler.
    - Make each recommendation simple and one line each instead of a long explanation. 
    - Don’t use gerunds and noun clauses.
    - Make the recommended sentences related to the diary.
    - Diversify the subject of the sentences (he, she, we, they, my boyfriend).
    - Mix past, present, and future tense (future = only use “will”).

    Examples:
    After that, I met my friends and we hung out together.
    I also ordered some chicken.
    It was a great day.
    That’s about it.
    I wrote about my appointment with my friends.
    I got home at 3am.
    A lot of things happened.
    I am busy nowadays.
    Recently, I started tennis.
    It was a very exciting day.
    There was nothing special today.
      `,
      "2": `
    Please recommend 10 sentences that this student can use at their level to make this diary better.

    Criteria:
    - Use the vocabulary of a toddler but keep in mind that this is still an adult diary so please don’t actually write it like a toddler but just use very easy vocabulary of a toddler.
    - Make each recommendation simple and one line each instead of a long explanation. 
    - Don’t use gerunds and noun clauses.
    - Make the recommended sentences related to the diary.
    - Diversify the subject of the sentences (he, she, we, they, my boyfriend).
    - Mix past, present, and future tense (future = only use “will”).

    Examples:
    After that, I met my friends and we hung out together.
    I also ordered some chicken.
    It was a great day.
    That’s about it.
    I wrote about my appointment with my friends.
    I got home at 3am.
    A lot of things happened.
    I am busy nowadays.
    Recently, I started tennis.
    It was a very exciting day.
    There was nothing special today.
      `,
      "3": `
    I am trying to recommend 10 new sentences that the student can use to make this diary better. 

    Criteria
    Please keep in line with the vocabulary level of the diary
    Make each recommendation simple and one line each instead of a long explanation. 

    For new sentences refer to the list below

    Expressions that the student learned (try to include similar expressions if it naturally fits into the diary) 
    I went to seoul to meet my friends
    I came here for class
    I want to go to japan to work for my career 
    for 2 years / for a week / for 10 years 
    while I ate breakfast / while eating breakfast 
    during vacation / during work / during the holidays
    I got off work late because I had a lot of work 
    my wife had to work late
    I wanted to eat dinner with my friend
    I don’t want to go there.
    after getting off work 
    before going to work
    I got ready for work / I got ready to go out 
    on the weekend / in the morning / on the next day
    at around 1pm
    I went to a cafe called starbucks
    after looking around
    it’s my favorite brand
    while drinking beer and watching netflix
    my girlfriend went home at around 10pm 
    it was a very busy and fun day
    today, I didn’t do anything
    I stayed home and rolled around on my bed all day
    I didn’t have anything to do
    I watched a show called squid game
    it’s very popular nowadays
    I am good at this game
    it was a tiring day / it was a busy day
    I will go to hongdae to have class with david now! 
    other than work, there was nothing special. 
    I was very excited / it was very exciting
    I was very interested / It was very interesting
    I am going to go home and change into my pajamas
    I think I’m gonna eat dinner with my family
    I’m not sure, but my wife is probably gonna cook for me
    I need to work on saturday. 

      `, // <–– insert full list here
      "4": `
      I am trying to recommend 10 new sentences that the student can use to make this diary better. 

Criteria
Please keep in line with the vocabulary level of the diary
Make each recommendation simple and one line each instead of a long explanation. 

For new sentences refer to the list below

Expressions that the student learned (try to include similar expressions if it naturally fits into the diary) 
I went to seoul to meet my friends
I came here for class
I want to go to japan to work for my career 
for 2 years / for a week / for 10 years 
while I ate breakfast / while eating breakfast 
during vacation / during work / during the holidays
I got off work late because I had a lot of work 
my wife had to work late
I wanted to eat dinner with my friend
I don’t want to go there.
after getting off work 
before going to work
I got ready for work / I got ready to go out 
on the weekend / in the morning / on the next day
at around 1pm
I went to a cafe called starbucks
after looking around
it’s my favorite brand
while drinking beer and watching netflix
my girlfriend went home at around 10pm 
it was a very busy and fun day
today, I didn’t do anything
I stayed home and rolled around on my bed all day
I didn’t have anything to do
I watched a show called squid game
it’s very popular nowadays
I am good at this game
it was a tiring day / it was a busy day
I will go to hongdae to have class with david now! 
other than work, there was nothing special. 
I was very excited / it was very exciting
I was very interested / It was very interesting
I am going to go home and change into my pajamas
I think I’m gonna eat dinner with my family
I’m not sure, but my wife is probably gonna cook for me
I need to work on saturday. 
I wanted to do something else. 
I was dreaming 
I started crying 
I was talking to my friend yesterday
exercising is good for your health
learning english is good for traveling
drinking is bad for you 
I was tired but I kept working 
I’m thinking about transferring jobs
she is thinking about quitting 
I was drunk but I kept drinking
I was sleepy but I kept studying quizlet
I will keep exercising every day
he is really trying hard
he has to earn a lot of money
I want to go traveling
working is tiring 
he is going to work again this weekend
working is boring but shopping is exciting

New expressions (prioritize these) 
David is a better student than sarah but daniel is the best student
Kyochon tastes better than BBQ, but Puradak tastes the best.  
I feel better than yesterday.  
Harry Potter was more interesting than Avatar, but Dune was the most interesting.  
Jogging is more tiring than hiking, but playing sports is the most exhausting.  
Can you recommend the most popular restaurant in Hongdae?  
My room is very small. It's almost [as small as a 고시원].  
You’re almost [as tall as me] now.  
Sarah got better at english. She’s now [almost as good as David].  
Sarah has [as much experience as David].  
I don’t have [as much money as you].
David was sick but he got better
You got much better at english! 
I got better at playing golf 
She got married / she got divorced 
my kids keep getting taller 
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
The plane will take off in an hour.
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
I met my middle school friends for the first time in a while
You can do whatever you want
Specifically 
she wanted me to go to church
I bought her a bag
She hung up the phone / I picked up the phone
I’m looking forward to the community event
I have to take care of my kids 
I was busy taking care of my cats
I think you should write a blog
I hope you really enjoy the community event
I’m gonna be in korea this winter
They bought me a lot of food
I’m really into wine these days
I don't like making mistakes 
Why don’t you come after getting off work? 
Unfortunately 
Thankfully 
To tell you about myself,
I was deciding [whether to drive or ride a bike but I chose to drive].
Whether to do A or B 
I don’t think this should be a habit 
it’s not related with / it doesn’t have anything to do with whitening 
you dont have to be sorry. it’s okay
By the way, where is the venue again?
she owes me 30,000won 
This bag costs 77,000won
the conversation got weird 
In conclusion, the project was a success.  
In summary, we achieved our goals this year.
it wasn’t worth it
All in all, it was a great experience.  
In the end, everything worked out fine.  
it was a waste of money
Normally, 
Originally, 
for the whole day
I had a very hard time / I had a very good time 
since then 
I spent like 8 hours making a song. 
to be honest, I couldn’t study that hard. It’s not perfect. But let’s try it. 
genuinely 
I can tell [that you studied] 
I can tell [that you really like music] 
      `, // with expanded expressions
      "5": `
      I am trying to recommend 10 new sentences that the student can use to make this diary better. 

Criteria
Please keep in line with the vocabulary level of the diary
Make each recommendation simple and one line each instead of a long explanation. 

For new sentences refer to the list below

Expressions that the student learned (try to include similar expressions if it naturally fits into the diary) 

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
The plane will take off in an hour.
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
I met my middle school friends for the first time in a while
You can do whatever you want
Specifically 
she wanted me to go to church
I bought her a bag
She hung up the phone / I picked up the phone
I’m looking forward to the community event
I have to take care of my kids 
I was busy taking care of my cats
I think you should write a blog
I hope you really enjoy the community event
I’m gonna be in korea this winter
They bought me a lot of food
I’m really into wine these days
I don't like making mistakes 
Why don’t you come after getting off work? 
Unfortunately 
Thankfully 
To tell you about myself,
I was deciding [whether to drive or ride a bike but I chose to drive].
Whether to do A or B 
I don’t think this should be a habit 
it’s not related with / it doesn’t have anything to do with whitening 
you dont have to be sorry. it’s okay
By the way, where is the venue again?
she owes me 30,000won 
This bag costs 77,000won
the conversation got weird 
In conclusion, the project was a success.  
In summary, we achieved our goals this year.
it wasn’t worth it
All in all, it was a great experience.  
In the end, everything worked out fine.  
it was a waste of money
Normally, 
Originally, 
for the whole day
I had a very hard time / I had a very good time 
since then 
I spent like 8 hours making a song. 
to be honest, I couldn’t study that hard. It’s not perfect. But let’s try it. 
genuinely 
I can tell [that you studied] 
I can tell [that you really like music] 

New expressions (prioritize these)

I told my friend [that I was drunk].  
She told me [that it was her first time coming to Korea].  
I heard [that he was good at soccer].  
My boss told me [that I have to finish this].  
She told me [that she can’t drink].  
I asked David [to give me fewer Quizlets].  
My student asked me [if we could cancel today’s class].  
I heard [that she quit her job].  
David told his student [to study].  
She told me [that she wanted to go home].  
My boss asked me [to come early].  
She asked me [if I ate dinner].  
I told her [that I want to get married one day].  
My boss asked me [if I wanted to come to the team dinner].  
I heard [that that restaurant was bad].  
I was like, “Let’s eat Korean barbecue.”  
She was like, “That sounds good!”  
My girlfriend said [that she wanted to go somewhere fun] today.  
I asked him [to call the restaurant for me].  
I told David [that I can’t come to class on Friday].
David asked Jeff if he can help him move. 
David asked Chris to come to the community event. 
I’m glad [that some classes were canceled] 
I’m glad [that I have time to spend with my brother] before he goes to the military
he said [that he has 40 days left]
I told my boss [that I plan to get married next month]
he told me to [let him know beforehand] 
I’m already worried [that I’m gonna be late]
I heard that movie was really sad so I decided not to watch it
I thought I was dreaming
I told my boyfriend [that I was going to buy some clothes] 
I thought [that it was it was close to my house]
I was gonna ask [if you had any plans for the weekend]
I didn’t even know [that I could take a break] 
I’m worried [that I’m going to be late]
he asked me [if I was okay]
      `,
      "6": `
      I am trying to recommend 10 new sentences that the student can use to make this diary better. 

Criteria
Please keep in line with the vocabulary level of the diary
Make each recommendation simple and one line each instead of a long explanation. 

For new sentences refer to the list below
Try to include a lot of 관계대명사 & 명사절

Expressions that the student learned (try to include similar expressions if it naturally fits into the diary) 

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
The plane will take off in an hour.
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
I met my middle school friends for the first time in a while
You can do whatever you want
Specifically 
she wanted me to go to church
I bought her a bag
She hung up the phone / I picked up the phone
I’m looking forward to the community event
I have to take care of my kids 
I was busy taking care of my cats
I think you should write a blog
I hope you really enjoy the community event
I’m gonna be in korea this winter
They bought me a lot of food
I’m really into wine these days
I don't like making mistakes 
Why don’t you come after getting off work? 
Unfortunately 
Thankfully 
To tell you about myself,
I was deciding [whether to drive or ride a bike but I chose to drive].
Whether to do A or B 
I don’t think this should be a habit 
it’s not related with / it doesn’t have anything to do with whitening 
you dont have to be sorry. it’s okay
By the way, where is the venue again?
she owes me 30,000won 
This bag costs 77,000won
the conversation got weird 
In conclusion, the project was a success.  
In summary, we achieved our goals this year.
it wasn’t worth it
All in all, it was a great experience.  
In the end, everything worked out fine.  
it was a waste of money
Normally, 
Originally, 
for the whole day
I had a very hard time / I had a very good time 
since then 
I spent like 8 hours making a song. 
to be honest, I couldn’t study that hard. It’s not perfect. But let’s try it. 
genuinely 
I can tell [that you studied] 
I can tell [that you really like music] 
I told my friend [that I was drunk].  
She told me [that it was her first time coming to Korea].  
I heard [that he was good at soccer].  
My boss told me [that I have to finish this].  
She told me [that she can’t drink].  
I asked David [to give me fewer Quizlets].  
My student asked me [if we could cancel today’s class].  
I heard [that she quit her job].  
David told his student [to study].  
She told me [that she wanted to go home].  
My boss asked me [to come early].  
She asked me [if I ate dinner].  
I told her [that I want to get married one day].  
My boss asked me [if I wanted to come to the team dinner].  
I heard [that that restaurant was bad].  
I was like, “Let’s eat Korean barbecue.”  
She was like, “That sounds good!”  
My girlfriend said [that she wanted to go somewhere fun] today.  
I asked him [to call the restaurant for me].  
I told David [that I can’t come to class on Friday].
David asked Jeff if he can help him move. 
David asked Chris to come to the community event. 
I’m glad [that some classes were canceled] 
I’m glad [that I have time to spend with my brother] before he goes to the military
he said [that he has 40 days left]
I told my boss [that I plan to get married next month]
he told me to [let him know beforehand] 
I’m already worried [that I’m gonna be late]
I heard that movie was really sad so I decided not to watch it
I thought I was dreaming
I told my boyfriend [that I was going to buy some clothes] 
I thought [that it was it was close to my house]
I was gonna ask [if you had any plans for the weekend]
I didn’t even know [that I could take a break] 
I’m worried [that I’m going to be late]
he asked me [if I was okay]

New expressions (prioritize these)
She’s [the girl that I met yesterday].  
[The girl that I liked] moved.  
[The guy that I met] was a comedian.  
I saw [who you met].  
I don’t remember [what I did yesterday].  
She said [that it was pretty].  
[When I was young], I was sick.  
I don’t know [why she was mad].  
I know [where you are].  
That’s [why I can’t drink milk].  
I know [that you lied].  
I thought [that it wasn’t pretty].  
I bought [water that costs 1000 won].  
[The food that I like] is pizza.  
[The company that I work for] is in Busan.  
I met [a girl that I like].  
That’s [the reason that I like you].  
I watched [Forrest Gump, which is the name of a movie].  
I really like [BTS, which is a famous K-pop boy group].
That's [the one that I bought] yesterday.
She's [the girl who(that) I met] at the party.
I went to [the coffee shop that I go to] every morning.
He's [the guy that I talked to].
That's [the show that I'm watching] right now.
She's [the friend who(that) I text] every day.
That's [where I buy my groceries].
That's [what I was looking for].
She's [who I have lunch with].
This is [the game that I'm obsessed with] lately.
That's [the bar where we hung out] last Friday.
She's [the person who I was telling you about].
That's [the restaurant where I want to eat].
This is [the movie that everyone's talking about].
That's [the dish that I always order].
This is [where I drink] every weekend.
He's [the dude who helped me move].
That's [when I realized that I needed to change].
This is [why I'm always late].
That’s [the reason why I have to leave korea]
I wonder [if he remembers my name]
 I hope (that) you enjoyed your trip
She explained [why she was late]
I’m not sure [if I can finish this on time] 
I forgot [that today is her birthday].
I made plans because I know [that tomorrow is your day off]. 
[The report that he wrote] is the key material for this project. 
[The project that he mentioned] has finally started. 
[The gym that I go to] operates 24 hours a day. 
The food [that she cooked is today's main dish.] 
[The subway station that I use every day] is under construction this week.
I don’t know (if)whether we can go hiking tomorrow.
I ate 전 which is like a korean traditional pancake 
I drank 막걸리 which is a type of traditional korean alcohol.
I couldn’t go to [the place that he recommended]
it was [a cafe that sold ice cream]
I was shocked at [how much he drank]
I know [that there are a lot of cherry blossoms] in 여의도.
I’m teaching [another student that watched that movie]
that was [the last time that I drank]
that was [not what I expected]
      `,
      "7": `I am trying to recommend 10 new sentences that the student can use to make this diary better. 

Criteria
Please keep in line with the vocabulary level of the diary
Make each recommendation simple and one line each instead of a long explanation. 
Try to include a lot of 관계대명사 & 명사절


For new sentences refer to the list below

Expressions that the student learned (try to include similar expressions if it naturally fits into the diary) 

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
The plane will take off in an hour.
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
I met my middle school friends for the first time in a while
You can do whatever you want
Specifically 
she wanted me to go to church
I bought her a bag
She hung up the phone / I picked up the phone
I’m looking forward to the community event
I have to take care of my kids 
I was busy taking care of my cats
I think you should write a blog
I hope you really enjoy the community event
I’m gonna be in korea this winter
They bought me a lot of food
I’m really into wine these days
I don't like making mistakes 
Why don’t you come after getting off work? 
Unfortunately 
Thankfully 
To tell you about myself,
I was deciding [whether to drive or ride a bike but I chose to drive].
Whether to do A or B 
I don’t think this should be a habit 
it’s not related with / it doesn’t have anything to do with whitening 
you dont have to be sorry. it’s okay
By the way, where is the venue again?
she owes me 30,000won 
This bag costs 77,000won
the conversation got weird 
In conclusion, the project was a success.  
In summary, we achieved our goals this year.
it wasn’t worth it
All in all, it was a great experience.  
In the end, everything worked out fine.  
it was a waste of money
Normally, 
Originally, 
for the whole day
I had a very hard time / I had a very good time 
since then 
I spent like 8 hours making a song. 
to be honest, I couldn’t study that hard. It’s not perfect. But let’s try it. 
genuinely 
I can tell [that you studied] 
I can tell [that you really like music] 
I told my friend [that I was drunk].  
She told me [that it was her first time coming to Korea].  
I heard [that he was good at soccer].  
My boss told me [that I have to finish this].  
She told me [that she can’t drink].  
I asked David [to give me fewer Quizlets].  
My student asked me [if we could cancel today’s class].  
I heard [that she quit her job].  
David told his student [to study].  
She told me [that she wanted to go home].  
My boss asked me [to come early].  
She asked me [if I ate dinner].  
I told her [that I want to get married one day].  
My boss asked me [if I wanted to come to the team dinner].  
I heard [that that restaurant was bad].  
I was like, “Let’s eat Korean barbecue.”  
She was like, “That sounds good!”  
My girlfriend said [that she wanted to go somewhere fun] today.  
I asked him [to call the restaurant for me].  
I told David [that I can’t come to class on Friday].
David asked Jeff if he can help him move. 
David asked Chris to come to the community event. 
I’m glad [that some classes were canceled] 
I’m glad [that I have time to spend with my brother] before he goes to the military
he said [that he has 40 days left]
I told my boss [that I plan to get married next month]
he told me to [let him know beforehand] 
I’m already worried [that I’m gonna be late]
I heard that movie was really sad so I decided not to watch it
I thought I was dreaming
I told my boyfriend [that I was going to buy some clothes] 
I thought [that it was it was close to my house]
I was gonna ask [if you had any plans for the weekend]
I didn’t even know [that I could take a break] 
I’m worried [that I’m going to be late]
he asked me [if I was okay]

New expressions (prioritize these)
She’s [the girl that I met yesterday].  
[The girl that I liked] moved.  
[The guy that I met] was a comedian.  
I saw [who you met].  
I don’t remember [what I did yesterday].  
She said [that it was pretty].  
[When I was young], I was sick.  
I don’t know [why she was mad].  
I know [where you are].  
That’s [why I can’t drink milk].  
I know [that you lied].  
I thought [that it wasn’t pretty].  
I bought [water that costs 1000 won].  
[The food that I like] is pizza.  
[The company that I work for] is in Busan.  
I met [a girl that I like].  
That’s [the reason that I like you].  
I watched [Forrest Gump, which is the name of a movie].  
I really like [BTS, which is a famous K-pop boy group].
That's [the one that I bought] yesterday.
She's [the girl who(that) I met] at the party.
I went to [the coffee shop that I go to] every morning.
He's [the guy that I talked to].
That's [the show that I'm watching] right now.
She's [the friend who(that) I text] every day.
That's [where I buy my groceries].
That's [what I was looking for].
She's [who I have lunch with].
This is [the game that I'm obsessed with] lately.
That's [the bar where we hung out] last Friday.
She's [the person who I was telling you about].
That's [the restaurant where I want to eat].
This is [the movie that everyone's talking about].
That's [the dish that I always order].
This is [where I drink] every weekend.
He's [the dude who helped me move].
That's [when I realized that I needed to change].
This is [why I'm always late].
That’s [the reason why I have to leave korea]
I wonder [if he remembers my name]
 I hope (that) you enjoyed your trip
She explained [why she was late]
I’m not sure [if I can finish this on time] 
I forgot [that today is her birthday].
I made plans because I know [that tomorrow is your day off]. 
[The report that he wrote] is the key material for this project. 
[The project that he mentioned] has finally started. 
[The gym that I go to] operates 24 hours a day. 
The food [that she cooked is today's main dish.] 
[The subway station that I use every day] is under construction this week.
I don’t know (if)whether we can go hiking tomorrow.
I ate 전 which is like a korean traditional pancake 
I drank 막걸리 which is a type of traditional korean alcohol.
I couldn’t go to [the place that he recommended]
it was [a cafe that sold ice cream]
I was shocked at [how much he drank]
I know [that there are a lot of cherry blossoms] in 여의도.
I’m teaching [another student that watched that movie]
that was [the last time that I drank]
that was [not what I expected]
`,
      "8": `
Please recommend 10 new sentences that the student can use to make this diary better. 

Criteria
Make each recommendation simple and one line each instead of a long explanation. 
students love to learn new expressions!
have the expressions be related to the story or the student
      `,
      "9": `
Please recommend 10 new sentences that the student can use to make this diary better. 

Criteria
recommend interesting but realistic expressions that natives would use.
Make each recommendation simple and one line each instead of a long explanation. 
      `,
      "10": `
Please recommend 10 new sentences that the student can use to make this diary better. 

Criteria
recommend interesting but realistic expressions that natives would use.
Make each recommendation simple and one line each instead of a long explanation. 
      `,
      "Business: Diary": `
    Please recommend 10 new sentences that the student can use to make this written material better.  
    Recommend expressions that would be helpful to learn when working in an English work environment.  
    Recommend expressions relevant to the content.  
    Recommend expressions that the student would actually say at work.
      `,
      "Business: In Depth": `
    Please recommend 10 new sentences that the student can use to make this written material better.  
    Recommend expressions that would be helpful to learn when working in an English work environment.  
    Recommend expressions relevant to the content.  
    Recommend expressions that the student would actually say at work.
      `
    };

    const selectedLevelInstruction = levelInstructions[level as keyof typeof levelInstructions] || "";

    
    
    const ai_diary_correction = async (original_text: string) => {
      const completion = await openaiClient.chat.completions.create({
        model: "gpt-4-turbo",
        response_format: { type: "json_object" }, // Ensures structured output
        messages: [
          {
            role: "system",
            content: `
            Your task is to analyze a student's diary entry, correct grammar mistakes, and provide explanations.
            ONLY return a valid JSON object with:
            - "errors": An array of objects with details on mistakes, including:
              - "errorContent": The incorrect text.
              - "errorType": The type of error (one word, e.g., "grammar", "spelling").
              - "errorFix": The corrected text.
              - "errorExplain": A simple explanation of the error in Korean, easy for kids to understand.
    
            Guidelines:
            - Maintain sentence structure and punctuation.
            - Do not introduce unnecessary corrections.
            - errorExplain MUST be in Korean. 
            - Ignore punctuation mistakes like commas, periods, and spaces.
            - Respond ONLY with a valid JSON object: { "errors": [...] }.
            - ${selectedLevelInstruction}
            `,
          },
          {
            role: "user",
            content: `Here's the text to correct: ${original_text}`,
          },
        ],
      });
    
      let response = completion.choices[0]?.message?.content?.trim();

      // Ensure the response is a JSON object
      try {
        if (typeof response === "string") {
          response = JSON.parse(response);
        }
      } catch (error) {
        console.error("Error parsing AI response:", error);
        return { correctedDiary: original_text, errors: [] }; // Return original text if parsing fails
      }
    
      return response;
    };
    

    const diary_correction = await ai_diary_correction(original_text);
    console.log(diary_correction);

    /// Diary Summary
    const ai_corrected_diary = async (original_text: string) => {
      const completion = await openaiClient.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              `${selectedLevelInstruction}`
          },
          {
            role: "user",
            content: `Here is the diary to summarize: ${original_text}`,
          },
        ],
      });

      return completion.choices[0]?.message?.content?.trim() ?? "";
    };
    
    const corrected_diary = await ai_corrected_diary(original_text);

    const ai_diary_expressions = async (original_text: string, level: string) => {
      const systemPrompt = expressionPrompts[level] || "Please recommend 10 useful English expressions for this diary.";

      const completion = await openaiClient.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `Here is the diary to improve: ${original_text}`,
          },
        ],
      });

      return completion.choices[0]?.message?.content?.trim() ?? "";
    };

    const diary_expressions = await ai_diary_expressions(original_text, level);

    console.log(diary_expressions);

    const ai_diary_summary = async (original_text: string, level: string) => {
      const systemPrompt = summaryPrompts[level] || "Please summarize this diary in less than 5 sentences.";

      const completion = await openaiClient.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `Here is the diary to summarize: ${original_text}`,
          },
        ],
      });

      return completion.choices[0]?.message?.content?.trim() ?? "";
    };

    const diary_summary = await ai_diary_summary(original_text, level);

    console.log(diary_summary);

    const result = await saveDiaryData(
      diaryData,
      diary_correction,
      corrected_diary,
      diary_expressions,
      diary_summary
    );

    return NextResponse.json(
      { message: "Data saved successfully", result },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

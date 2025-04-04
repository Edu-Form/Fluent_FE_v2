"use client";
import React from "react";

export default function Page() {
  return (
    <div className="max-h-[95vh] overflow-auto bg-[#F9FAFB] p-6 text-gray-800">
      <div className=" mx-auto space-y-8">
        {/* Timer */}
        <div>
          <h2 className="text-2xl font-bold mb-1">🕒 Timer: 0 minute mark</h2>
        </div>

        {/* Basic Questions */}
        <section className="bg-white p-4 rounded shadow space-y-3">
          <h3 className="text-xl font-semibold">Basic Questions</h3>
          <p className="text-sm text-gray-600">Date: 한국말로 물어보고 답하기</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>오늘 날짜가 어떻게 되나요?</li>
            <li>오늘 무슨 요일인가요?</li>
          </ul>

          <h4 className="font-semibold mt-2">Greet the teacher:</h4>
          <p className="italic">Can you say hi to me in 3 different ways? (try to get the harder ones)</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            <div>
              <p>How are you today?</p>
              <p className="text-gray-500 text-sm">I’m good and you?</p>
            </div>
            <div>
              <p>How was your day?</p>
              <p className="text-gray-500 text-sm">It was good and yours?</p>
            </div>
            <div>
              <p>What did you do today?</p>
              <p className="text-gray-500 text-sm">There was nothing special</p>
            </div>
            <div>
              <p>How have you been?</p>
              <p className="text-gray-500 text-sm">I’ve been good</p>
            </div>
            <div>
              <p>How is it going?</p>
              <p className="text-gray-500 text-sm">It’s going well</p>
            </div>
            <div>
              <p>How are you doing?</p>
              <p className="text-gray-500 text-sm">I’m doing well</p>
            </div>
            <div>
              <p>What’s going on?</p>
              <p className="text-gray-500 text-sm">Nothing special</p>
            </div>
            <div>
              <p>What’s up?</p>
              <p className="text-gray-500 text-sm">Nothing much</p>
            </div>
            <div>
              <p>How is everything?</p>
              <p className="text-gray-500 text-sm">Everything is good</p>
            </div>
            <div>
              <p>Is everything going well?</p>
              <p className="text-gray-500 text-sm">Yeah, everything’s good</p>
            </div>
            <div>
              <p>What’s on your mind?</p>
              <p className="text-gray-500 text-sm">Nothing much (there’s nothing on my mind)</p>
            </div>
          </div>
          <p className="italic text-sm mt-2">…and more!</p>
        </section>

        {/* Common Questions */}
        <section className="bg-white p-4 rounded shadow space-y-3">
          <h3 className="text-xl font-semibold">Common Questions (ask all)</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Hi XX, long time no see, can you introduce yourself?
              <span className="text-gray-500 text-sm block">[Talking about oneself] [Must memorize]</span>
            </li>
            <li>
              What are your hobbies?
              <span className="text-gray-500 text-sm block">[Verbal Nouns] [Like to]</span>
            </li>
            <li>
              What do you do? (what is your job?) Tell me more about your job.
              <span className="text-gray-500 text-sm block">[Must memorize]</span>
            </li>
          </ul>
        </section>


        <br />
        {/* Timer 10 min */}
        <div>
            <h2 className="text-2xl font-bold mb-1">🕒 Timer: 10 minute mark</h2>
        </div>

        {/* Additional Questions */}
        <section className="bg-white p-4 rounded shadow space-y-3">
          <h3 className="text-xl font-semibold">Additional Questions</h3>
          <p className="text-sm text-gray-600">
            All 5 questions are mandatory. Must say this in bulk. (5~10 sentences)
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>What did you do today / this morning / yesterday? <span className="text-gray-500">[past tense]</span></li>
            <li>What are you going to do tomorrow/ on the weekend? <span className="text-gray-500">[future tense] [be going to V]</span></li>
            <li>Can you tell me about your best friend? <span className="text-gray-500">[3rd person singular] [likes / does / is]</span></li>
            <li>Can you tell me about a close coworker or colleague?</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

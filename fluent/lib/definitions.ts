export type Student = {
  _id?: string
  name: string
  age: number
  job: string
  phoneNumber: string
  selfPerceivedLevel: number
  englishGoal: number
  reasonForStudying: string
  englishBackground: string
  expectedDuration: string
  homeworkHours: string
  consentForRecording: "Yes" | "No"
  commonQuestion1: string
  commonQuestion2: string
  translation1: string
  translation2: string
  translation3: string
  translation4: string
  translation5: string
  translation6: string
  translation7: string
  translation8: string
  translation9: string
  translation10: string
  translation11: string
  translation12: string
  translation13: string
  translation14: string
  translation15: string
  translation16: string
  translation17: string
  translation18: string
  translation19: string
  translation20: string
  level: number
  levelDescription: string
  curriculum: string
  classSchedule: string
  finalizedNotes: string
  signedUp: boolean
  status: "lost cause" | "didn't decide yet" | "paid but teacher not assigned" | "finalized"
  teacher: string
  paymentNotes: string
  createdAt: string
  credits: number
  paymentHistory: string
  paymentId?: string;
  orderId?: string;
  paymentStatus?: 'PENDING' | 'COMPLETED' | 'FAILED';
}

export type Teacher = {
  _id?: string
  name: string
  phoneNumber : string
  experience: string
  notes: string
  createdAt: string
}
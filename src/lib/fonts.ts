import { Noto_Sans, Noto_Sans_Hebrew, Noto_Sans_Thai } from "next/font/google";

// One family per script so Hebrew, Thai, Vietnamese and English all render
// in a matching typeface. The CSS stack in globals.css lists all three.
const notoSans = Noto_Sans({ subsets: ["latin", "vietnamese"], variable: "--font-noto" });
const notoHebrew = Noto_Sans_Hebrew({ subsets: ["hebrew"], variable: "--font-noto-hebrew" });
const notoThai = Noto_Sans_Thai({ subsets: ["thai"], variable: "--font-noto-thai" });

export const fontClassName = `${notoSans.variable} ${notoHebrew.variable} ${notoThai.variable}`;

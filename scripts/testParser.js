import { testingParser } from "../src/instagramCrawler.js";

const samples = [
  "365 kiriman 8.716 pengikut 300 diikuti",
  "365 posts 8,716 followers 300 following",
  "20,5 rb pengikut",
  "12.7K followers",
  "1.2M followers"
];

for (const sample of samples) {
  console.log(sample, "=>", testingParser.parseMetric(sample, "followers"));
}

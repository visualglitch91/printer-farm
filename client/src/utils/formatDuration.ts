import humanizeDuration from "humanize-duration";

const formatDuration = humanizeDuration.humanizer({
  language: "shortEn",
  serialComma: false,
  conjunction: "",
  delimiter: " ",
  spacer: "",
  languages: {
    shortEn: {
      y: () => "y",
      mo: () => "mo",
      w: () => "w",
      d: () => "d",
      h: () => "h",
      m: () => "m",
      s: () => "s",
      ms: () => "ms",
    },
  },
  maxDecimalPoints: 0,
});

export default formatDuration;

import { Fragment, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

type ReportMarkdownProps = {
  markdown: string;
  isDark: boolean;
};

function inline(content: string, color: string): ReactNode {
  return content.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <Text key={`${part}-${index}`} style={[styles.bold, { color }]}>
        {part.slice(2, -2)}
      </Text>
    ) : (
      <Fragment key={`${part}-${index}`}>{part}</Fragment>
    )
  );
}

function tableCells(line: string): string[] {
  return line
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim());
}

export function ReportMarkdown({ markdown, isDark }: ReportMarkdownProps) {
  const textColor = isDark ? "#E6E1E5" : "#1D1B20";
  const accentColor = isDark ? "#D0BCFF" : "#4F378B";
  const outlineColor = isDark ? "#49454F" : "#CAC4D0";
  const lines = markdown.split(/\r?\n/);

  return (
    <View accessibilityRole="summary">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return <View key={`space-${index}`} style={styles.space} />;

        const heading = /^(#{1,3})\s+(.+)$/.exec(trimmed);
        if (heading) {
          const level = heading[1]?.length ?? 3;
          return (
            <Text
              key={`heading-${index}`}
              accessibilityRole="header"
              style={[
                level === 1 ? styles.heading1 : styles.heading2,
                { color: level === 1 ? textColor : accentColor }
              ]}
            >
              {inline(heading[2] ?? "", level === 1 ? textColor : accentColor)}
            </Text>
          );
        }

        if (/^\|?\s*:?-{3,}/.test(trimmed)) return null;
        if (trimmed.includes("|")) {
          return (
            <View key={`row-${index}`} style={[styles.tableRow, { borderColor: outlineColor }]}>
              {tableCells(trimmed).map((cell, cellIndex) => (
                <Text
                  key={`${cell}-${cellIndex}`}
                  style={[styles.tableCell, { color: textColor }]}
                >
                  {inline(cell, textColor)}
                </Text>
              ))}
            </View>
          );
        }

        const bullet = /^(?:[-*]|\d+\.)\s+(.+)$/.exec(trimmed);
        if (bullet) {
          return (
            <View key={`bullet-${index}`} style={styles.bulletRow}>
              <Text style={[styles.bullet, { color: accentColor }]}>•</Text>
              <Text style={[styles.body, styles.bulletText, { color: textColor }]}>
                {inline(bullet[1] ?? "", textColor)}
              </Text>
            </View>
          );
        }

        return (
          <Text key={`paragraph-${index}`} style={[styles.body, { color: textColor }]}>
            {inline(trimmed, textColor)}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  heading1: { fontSize: 27, fontWeight: "700", marginBottom: 8 },
  heading2: { fontSize: 21, fontWeight: "700", marginTop: 16, marginBottom: 6 },
  body: { fontSize: 16, lineHeight: 25, marginBottom: 6 },
  bold: { fontWeight: "700" },
  space: { height: 6 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", paddingRight: 8 },
  bullet: { width: 22, fontSize: 18, lineHeight: 25 },
  bulletText: { flex: 1 },
  tableRow: { flexDirection: "row", borderWidth: StyleSheet.hairlineWidth },
  tableCell: { flex: 1, padding: 7, fontSize: 13, lineHeight: 19 }
});

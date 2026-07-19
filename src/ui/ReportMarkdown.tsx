import { Fragment, type ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

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

function isTableSeparator(line: string): boolean {
  const cells = tableCells(line.trim());
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

type ReportTableProps = {
  headers: string[];
  rows: string[][];
  isDark: boolean;
};

function ReportTable({ headers, rows, isDark }: ReportTableProps) {
  const textColor = isDark ? "#E6E1E5" : "#1D1B20";
  const outlineColor = isDark ? "#49454F" : "#CAC4D0";
  const headerColor = isDark ? "#2B2930" : "#F3EDF7";
  const columnCount = Math.max(headers.length, ...rows.map((row) => row.length));
  const tableWidth = Math.max(640, columnCount * 160);

  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator
      style={styles.tableScroll}
      accessibilityLabel="报告数据表格，可横向滚动"
    >
      <View style={[styles.table, { width: tableWidth, borderColor: outlineColor }]}>
        <View style={[styles.tableRow, { backgroundColor: headerColor }]}>
          {Array.from({ length: columnCount }, (_, cellIndex) => (
            <Text
              key={`header-${cellIndex}`}
              style={[
                styles.tableCell,
                styles.tableHeaderCell,
                { color: textColor, borderColor: outlineColor }
              ]}
            >
              {inline(headers[cellIndex] ?? "", textColor)}
            </Text>
          ))}
        </View>
        {rows.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.tableRow}>
            {Array.from({ length: columnCount }, (_, cellIndex) => (
              <Text
                key={`cell-${rowIndex}-${cellIndex}`}
                style={[
                  styles.tableCell,
                  { color: textColor, borderColor: outlineColor }
                ]}
              >
                {inline(row[cellIndex] ?? "", textColor)}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export function ReportMarkdown({ markdown, isDark }: ReportMarkdownProps) {
  const textColor = isDark ? "#E6E1E5" : "#1D1B20";
  const accentColor = isDark ? "#D0BCFF" : "#4F378B";
  const lines = markdown.split(/\r?\n/);
  const blocks: ReactNode[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    const trimmed = line.trim();
    if (!trimmed) {
      blocks.push(<View key={`space-${index}`} style={styles.space} />);
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (heading) {
      const level = heading[1]?.length ?? 3;
      blocks.push(
        <Text
          key={`heading-${index}`}
          accessibilityRole="header"
          style={[
            level === 1
              ? styles.heading1
              : level === 2
                ? styles.heading2
                : styles.heading3,
            { color: level === 1 ? textColor : accentColor }
          ]}
        >
          {inline(heading[2] ?? "", level === 1 ? textColor : accentColor)}
        </Text>
      );
      continue;
    }

    const nextLine = lines[index + 1] ?? "";
    if (trimmed.includes("|") && isTableSeparator(nextLine)) {
      const headers = tableCells(trimmed);
      const rows: string[][] = [];
      let rowIndex = index + 2;
      while (rowIndex < lines.length) {
        const row = (lines[rowIndex] ?? "").trim();
        if (!row || !row.includes("|")) break;
        rows.push(tableCells(row));
        rowIndex += 1;
      }
      blocks.push(
        <ReportTable
          key={`table-${index}`}
          headers={headers}
          rows={rows}
          isDark={isDark}
        />
      );
      index = rowIndex - 1;
      continue;
    }

    const bullet = /^(?:([-*])|(\d+)\.)\s+(.+)$/.exec(trimmed);
    if (bullet) {
      blocks.push(
        <View key={`bullet-${index}`} style={styles.bulletRow}>
          <Text style={[styles.bullet, { color: accentColor }]}>
            {bullet[2] ? `${bullet[2]}.` : "•"}
          </Text>
          <Text style={[styles.body, styles.bulletText, { color: textColor }]}>
            {inline(bullet[3] ?? "", textColor)}
          </Text>
        </View>
      );
      continue;
    }

    blocks.push(
      <Text key={`paragraph-${index}`} style={[styles.body, { color: textColor }]}>
        {inline(trimmed, textColor)}
      </Text>
    );
  }

  return (
    <View accessibilityRole="summary">
      {blocks}
    </View>
  );
}

const styles = StyleSheet.create({
  heading1: { fontSize: 27, fontWeight: "700", marginBottom: 8 },
  heading2: { fontSize: 21, fontWeight: "700", marginTop: 16, marginBottom: 6 },
  heading3: { fontSize: 18, fontWeight: "700", marginTop: 12, marginBottom: 4 },
  body: { fontSize: 16, lineHeight: 25, marginBottom: 6 },
  bold: { fontWeight: "700" },
  space: { height: 6 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", paddingRight: 8 },
  bullet: { width: 22, fontSize: 18, lineHeight: 25 },
  bulletText: { flex: 1 },
  tableScroll: { marginVertical: 8 },
  table: { borderWidth: StyleSheet.hairlineWidth },
  tableRow: { flexDirection: "row" },
  tableCell: {
    flex: 1,
    padding: 10,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    fontSize: 13,
    lineHeight: 19
  },
  tableHeaderCell: { fontWeight: "700" }
});

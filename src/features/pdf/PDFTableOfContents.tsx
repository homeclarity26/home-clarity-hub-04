import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { colors, s } from "./pdfStyles";
import PDFFooter from "./PDFFooter";
import type { PortalGroup } from "@/hooks/useClientPortal";
import type { ReportPageData } from "@/data/reportContent";

interface PDFTableOfContentsProps {
  groups: PortalGroup[];
  pages: Record<string, ReportPageData>;
}

const tc = StyleSheet.create({
  title: {
    fontFamily: "Cormorant Garamond",
    fontSize: 28,
    color: colors.navy,
    marginBottom: 40,
  },
  groupTitle: {
    fontFamily: "IBM Plex Mono",
    fontSize: 9,
    fontWeight: 600,
    color: colors.gold,
    textTransform: "uppercase",
    letterSpacing: 2.5,
    marginBottom: 10,
    marginTop: 24,
  },
  entry: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 6,
    paddingLeft: 12,
  },
  entryTitle: {
    fontFamily: "IBM Plex Mono",
    fontSize: 10,
    color: colors.navy,
    flex: 1,
  },
  dots: {
    fontFamily: "IBM Plex Mono",
    fontSize: 10,
    color: colors.grey300,
    flex: 1,
    marginHorizontal: 8,
  },
  pageNum: {
    fontFamily: "IBM Plex Mono",
    fontSize: 10,
    color: colors.grey500,
    width: 24,
    textAlign: "right",
  },
});

const PDFTableOfContents = ({ groups, pages }: PDFTableOfContentsProps) => {
  // Calculate page numbers (approximate): cover=1, title=2, toc=3, then content starts at 4
  // Each group has a divider page, then each page in that group
  let pageCounter = 4;

  return (
    <Page size="LETTER" style={s.page}>
      <Text style={tc.title}>Contents</Text>

      {groups.map((group, gi) => {
        const groupStartPage = pageCounter;
        // Divider page for each group
        pageCounter++;

        return (
          <View key={group.id}>
            {gi === 0 ? null : <View style={{ height: 4 }} />}
            <Text style={tc.groupTitle}>{group.title}</Text>
            {group.pages.map((pageId) => {
              const p = pages[pageId];
              if (!p) return null;
              const currentPage = pageCounter;
              pageCounter++;
              return (
                <View key={pageId} style={tc.entry}>
                  <Text style={tc.entryTitle}>{p.title}</Text>
                  <Text style={tc.dots}>
                    {"· ".repeat(20)}
                  </Text>
                  <Text style={tc.pageNum}>{currentPage}</Text>
                </View>
              );
            })}
          </View>
        );
      })}

      <PDFFooter sectionName="Contents" />
    </Page>
  );
};

export default PDFTableOfContents;

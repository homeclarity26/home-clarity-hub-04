import { View, Text } from "@react-pdf/renderer";
import { s } from "./pdfStyles";

interface PDFFooterProps {
  sectionName: string;
}

const PDFFooter = ({ sectionName }: PDFFooterProps) => (
  <View style={s.footer} fixed>
    <Text style={s.footerText}>Hometown Builders Club</Text>
    <Text
      style={s.footerText}
      render={({ pageNumber }) => `${pageNumber}`}
    />
    <Text style={s.footerText}>{sectionName}</Text>
  </View>
);

export default PDFFooter;

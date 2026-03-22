import { View, Text } from "@react-pdf/renderer";
import { s } from "./pdfStyles";

interface PDFFooterProps {
  sectionName: string;
  companyName?: string;
}

const PDFFooter = ({ sectionName, companyName = "Home Clarity Hub" }: PDFFooterProps) => (
  <View style={s.footer} fixed>
    <Text style={s.footerText}>{companyName}</Text>
    <Text
      style={s.footerText}
      render={({ pageNumber }) => `${pageNumber}`}
    />
    <Text style={s.footerText}>{sectionName}</Text>
  </View>
);

export default PDFFooter;

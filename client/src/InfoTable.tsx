import { Paper, Table } from "@mantine/core";

export function InfoTable({
  data,
}: {
  data: [React.ReactNode, React.ReactNode][];
}) {
  return (
    <Paper py={4}>
      <Table>
        <Table.Tbody>
          {data.map(([label, value], index) => (
            <Table.Tr key={index}>
              <Table.Td pl={18} style={{ fontWeight: "bold" }}>
                {label}
              </Table.Td>
              <Table.Td pr={18} style={{ textAlign: "right" }}>
                {value}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}

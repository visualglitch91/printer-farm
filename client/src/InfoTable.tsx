import { Paper, Table } from "@mantine/core";

export function InfoTable({
  data,
}: {
  data: ([React.ReactNode, React.ReactNode] | null)[];
}) {
  return (
    <Paper py={4}>
      <Table>
        <Table.Tbody>
          {data.map((it, index) => {
            if (it === null) {
              return null;
            }

            return (
              <Table.Tr key={index}>
                <Table.Td
                  pl={18}
                  style={{ fontWeight: "bold", whiteSpace: "nowrap" }}
                >
                  {it[0]}
                </Table.Td>
                <Table.Td pr={18} style={{ textAlign: "right" }}>
                  {it[1]}
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}

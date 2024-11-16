import { Button, Flex, Title } from "@mantine/core";

export default function Macros({
  macros,
  confirmAndCall,
}: {
  macros: [string, string][];
  confirmAndCall: (
    message: string,
    method: string,
    params?: Record<string, any>
  ) => void;
}) {
  return (
    <div>
      <Title order={5}>Macros</Title>
      <Flex wrap="wrap" gap={8}>
        {macros.map(([macro, label]) => (
          <Button
            key={macro}
            size="xs"
            color="purple"
            onClick={() => {
              confirmAndCall(
                `Are you sure you want to run "${label}"?`,
                "run_macro",
                { macro }
              );
            }}
          >
            {label}
          </Button>
        ))}
      </Flex>
    </div>
  );
}

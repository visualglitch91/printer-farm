import { Button, Flex, Title } from "@mantine/core";

export default function Macros({
  macros,
  confirmAndCall,
}: {
  macros: string[];
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
        {macros.map((macro) => (
          <Button
            key={macro}
            size="xs"
            color="purple"
            onClick={() => {
              confirmAndCall(
                `Are you sure you want to run "${macro}"?`,
                "run_macro",
                { macro }
              );
            }}
          >
            {macro}
          </Button>
        ))}
      </Flex>
    </div>
  );
}

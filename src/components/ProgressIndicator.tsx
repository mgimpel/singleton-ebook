import { Group, Progress, Text } from "@mantine/core";
import { clampFraction, formatProgressPercent } from "../lib/readingProgress";

interface ProgressIndicatorProps {
  /** Reading progress as a fraction in [0, 1]; clamped before display. */
  fraction: number;
}

/**
 * Shows the current reading progress: a Mantine `Progress` bar plus a
 * percentage label. The label and bar are derived from the same clamped
 * fraction so they always agree (Req 6.3).
 */
export default function ProgressIndicator({ fraction }: ProgressIndicatorProps) {
  const percent = formatProgressPercent(fraction);

  return (
    <Group gap="xs" wrap="nowrap">
      <Progress
        flex={1}
        value={clampFraction(fraction) * 100}
        aria-label={percent}
      />
      <Text size="sm" c="dimmed">
        {percent}
      </Text>
    </Group>
  );
}

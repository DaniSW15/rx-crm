import type { KeyboardCoordinateGetter } from "@dnd-kit/core";

// Snap to columns instead of moving by pixels, including columns with no cards.
export const kanbanKeyboardCoordinates: KeyboardCoordinateGetter = (
    event,
    { context, currentCoordinates },
) => {
    if (event.code !== "ArrowLeft" && event.code !== "ArrowRight") return;
    event.preventDefault();
    const { collisionRect, droppableContainers, droppableRects, over, active } = context;
    if (!collisionRect || !active) return;

    const columns = droppableContainers
        .getEnabled()
        .filter((container) => container.data.current?.type === "stage")
        .sort(
            (a, b) => (droppableRects.get(a.id)?.left ?? 0) - (droppableRects.get(b.id)?.left ?? 0),
        );
    const currentId = over?.id ?? active.data.current?.stageId;
    const index = columns.findIndex((column) => column.id === currentId);
    if (index === -1) return;
    const next = columns[index + (event.code === "ArrowRight" ? 1 : -1)];
    const target = next && droppableRects.get(next.id);
    if (!target) return;

    return {
        x: currentCoordinates.x + target.left - collisionRect.left,
        y: currentCoordinates.y + target.top - collisionRect.top,
    };
};

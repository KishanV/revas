import { Node } from "./Node";
import { getStyleFromNode, getFrameFromNode, sortByZIndexAscending } from "../common/utils";

/**
 * Draw a RenderLayer instance to a <canvas> context.
 *
 * @param {CanvasRenderingContext2d} ctx
 * @param {Node} node
 */
export function drawRenderLayer(ctx: CanvasRenderingContext2D, node: Node) {
  const style = getStyleFromNode(node)

  // Performance: avoid drawing hidden layers.
  if (typeof style.opacity === 'number' && style.opacity <= 0) {
    return;
  }

  // Establish drawing context for certain properties:
  // - opacity
  // - translate
  const saveContext = (style.opacity !== null && style.opacity < 1) ||
    (style.translateX || style.translateY);

  if (saveContext) {
    ctx.save();

    // Opacity:
    if (style.opacity !== null && style.opacity < 1) {
      ctx.globalAlpha = style.opacity;
    }

    // Translation:
    if (style.translateX || style.translateY) {
      ctx.translate(style.translateX || 0, style.translateY || 0);
      // TODO: tranform: rotate scale...
    }
  }

  // Draw default properties, such as background color.
  ctx.save();
  drawBaseRenderLayer(ctx, node);

  // Draw custom properties if needed.
  node.props.customDrawer && node.props.customDrawer(ctx, node);
  ctx.restore();

  // Draw child layers, sorted by their z-index.
  node.children
    .slice()
    .sort(sortByZIndexAscending)
    .forEach(child => {
      drawRenderLayer(ctx, child);
    });

  // Pop the context state if we established a new drawing context.
  if (saveContext) {
    ctx.restore();
  }
}

function drawBaseRenderLayer(ctx: CanvasRenderingContext2D, node: Node) {
  const style = getStyleFromNode(node)
  const frame = getFrameFromNode(node)

  // Border radius:
  if (style.borderRadius) {
    ctx.beginPath();
    ctx.moveTo(frame.x + style.borderRadius, frame.y);
    ctx.arcTo(frame.x + frame.width, frame.y, frame.x + frame.width, frame.y + frame.height, style.borderRadius);
    ctx.arcTo(frame.x + frame.width, frame.y + frame.height, frame.x, frame.y + frame.height, style.borderRadius);
    ctx.arcTo(frame.x, frame.y + frame.height, frame.x, frame.y, style.borderRadius);
    ctx.arcTo(frame.x, frame.y, frame.x + frame.width, frame.y, style.borderRadius);
    ctx.closePath();

    // Border with border radius:
    if (style.borderColor) {
      ctx.lineWidth = style.borderWidth || 1;
      ctx.strokeStyle = style.borderColor;
      ctx.stroke();
    }
  } else {
    ctx.rect(frame.x, frame.y, frame.width, frame.height)
  }

  if (style.overflow === 'hidden') {
    ctx.clip()
  }


  // Border color (no border radius):
  if (style.borderColor && !style.borderRadius) {
    ctx.lineWidth = style.borderWidth || 1;
    ctx.strokeStyle = style.borderColor;
    ctx.strokeRect(frame.x, frame.y, frame.width, frame.height);
  }

  // Shadow:
  ctx.shadowBlur = style.shadowBlur;
  ctx.shadowColor = style.shadowColor;
  ctx.shadowOffsetX = style.shadowOffsetX;
  ctx.shadowOffsetY = style.shadowOffsetY;

  // Background color:
  if (style.backgroundColor) {
    ctx.fillStyle = style.backgroundColor;
    if (style.borderRadius) {
      // Fill the current path when there is a borderRadius set.
      ctx.fill();
    } else {
      ctx.fillRect(frame.x, frame.y, frame.width, frame.height);
    }
  }
}
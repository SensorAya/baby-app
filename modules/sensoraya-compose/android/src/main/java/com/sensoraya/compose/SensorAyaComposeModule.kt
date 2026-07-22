package com.sensoraya.compose

import android.os.Build
import androidx.activity.BackEventCompat
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.compose.foundation.gestures.AnchoredDraggableState
import androidx.compose.foundation.gestures.DraggableAnchors
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.gestures.anchoredDraggable
import androidx.compose.foundation.gestures.animateTo
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.OptimizedComposeProps
import kotlinx.coroutines.launch

private enum class SwipeAnchor {
  Closed,
  Delete,
  Share,
}

@OptimizedComposeProps
data class SavedReportCardProps(
  val cacheKey: String = "",
  val label: String = "",
  val dateRange: String = "",
  val metadata: String = "",
  val darkTheme: Boolean = false,
  val primaryColor: String = "#6750A4FF",
  val onPrimaryColor: String = "#FFFFFFFF",
  val surfaceColor: String = "#FFFBFEFF",
  val surfaceContainerLowColor: String = "#F7F2FAFF",
  val onSurfaceColor: String = "#1D1B20FF",
  val onSurfaceVariantColor: String = "#49454FFF",
  val surfaceTintColor: String = "#6750A4FF",
  val errorColor: String = "#BA1A1AFF",
  val onErrorColor: String = "#FFFFFFFF",
  val secondaryContainerColor: String = "#E8DEF8FF",
  val onSecondaryContainerColor: String = "#1D192BFF",
) : ComposeProps

private fun rgbaHexToColor(value: String, fallback: Color): Color {
  val hex = value.removePrefix("#")
  val parsed = hex.toLongOrNull(16) ?: return fallback
  return when (hex.length) {
    6 -> Color((0xFF000000L or parsed).toInt())
    8 -> {
      val alpha = parsed and 0xFF
      val rgb = parsed ushr 8
      Color(((alpha shl 24) or rgb).toInt())
    }
    else -> fallback
  }
}

class SensorAyaComposeModule : Module() {
  private var predictiveBackEnabled = false
  private var predictiveBackCallback: OnBackPressedCallback? = null
  private var reactNativeBackCallback: OnBackPressedCallback? = null
  private var attachedActivity: ComponentActivity? = null

  private fun findReactNativeBackCallback(
    activity: ComponentActivity,
  ): OnBackPressedCallback? {
    var type: Class<*>? = activity.javaClass
    while (type != null) {
      val callback = type.declaredFields.firstNotNullOfOrNull { field ->
        if (!OnBackPressedCallback::class.java.isAssignableFrom(field.type)) {
          return@firstNotNullOfOrNull null
        }
        runCatching {
          field.isAccessible = true
          field.get(activity) as? OnBackPressedCallback
        }.getOrNull()
      }
      if (callback != null) return callback
      type = type.superclass
    }
    return null
  }

  private fun setReactNativeBackEnabled(
    activity: ComponentActivity,
    enabled: Boolean,
  ) {
    val callback = reactNativeBackCallback
      ?: findReactNativeBackCallback(activity)?.also {
        reactNativeBackCallback = it
      }
    callback?.isEnabled = enabled
  }

  private fun emitPredictiveBack(
    phase: String,
    progress: Float,
    swipeEdge: Int,
  ) {
    sendEvent(
      "onPredictiveBack",
      mapOf(
        "phase" to phase,
        "progress" to progress.toDouble(),
        "edge" to if (swipeEdge == BackEventCompat.EDGE_RIGHT) "right" else "left",
      ),
    )
  }

  private fun attachPredictiveBackCallback() {
    val activity = appContext.currentActivity as? ComponentActivity ?: return
    if (attachedActivity === activity && predictiveBackCallback != null) {
      setReactNativeBackEnabled(activity, predictiveBackEnabled)
      predictiveBackCallback?.isEnabled = predictiveBackEnabled
      return
    }

    predictiveBackCallback?.remove()
    reactNativeBackCallback = null
    setReactNativeBackEnabled(activity, predictiveBackEnabled)
    val callback = object : OnBackPressedCallback(predictiveBackEnabled) {
      override fun handleOnBackStarted(backEvent: BackEventCompat) {
        emitPredictiveBack("started", backEvent.progress, backEvent.swipeEdge)
      }

      override fun handleOnBackProgressed(backEvent: BackEventCompat) {
        emitPredictiveBack("progressed", backEvent.progress, backEvent.swipeEdge)
      }

      override fun handleOnBackCancelled() {
        emitPredictiveBack("cancelled", 0f, BackEventCompat.EDGE_LEFT)
      }

      override fun handleOnBackPressed() {
        emitPredictiveBack("committed", 1f, BackEventCompat.EDGE_LEFT)
      }
    }
    activity.onBackPressedDispatcher.addCallback(activity, callback)
    predictiveBackCallback = callback
    attachedActivity = activity
  }

  private fun detachPredictiveBackCallback() {
    predictiveBackCallback?.remove()
    predictiveBackCallback = null
    reactNativeBackCallback = null
    attachedActivity = null
  }

  private fun updateBackStackState(hasInAppDestination: Boolean) {
    predictiveBackEnabled = hasInAppDestination
    val activity = appContext.currentActivity as? ComponentActivity ?: return
    setReactNativeBackEnabled(activity, hasInAppDestination)
    if (hasInAppDestination) {
      attachPredictiveBackCallback()
    } else {
      predictiveBackCallback?.isEnabled = false
    }
  }

  override fun definition() = ModuleDefinition {
    Name("SensorAyaCompose")
    Events("onPredictiveBack")

    Function("isPredictiveBackAvailable") {
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE
    }

    AsyncFunction("setPredictiveBackEnabled") { enabled: Boolean ->
      updateBackStackState(enabled)
    }.runOnQueue(Queues.MAIN)

    OnActivityEntersForeground {
      updateBackStackState(predictiveBackEnabled)
    }

    OnActivityDestroys {
      detachPredictiveBackCallback()
    }

    OnDestroy {
      detachPredictiveBackCallback()
    }

    View<SavedReportCardProps>("SavedReportCard") {
      val onOpen by Event<Unit>()
      val onDelete by Event<Unit>()
      val onShare by Event<Unit>()

      Content { props ->
        SavedReportCard(
          props = props,
          onOpen = { onOpen(Unit) },
          onDelete = { onDelete(Unit) },
          onShare = { onShare(Unit) },
        )
      }
    }
  }
}

@Composable
private fun SavedReportCard(
  props: SavedReportCardProps,
  onOpen: () -> Unit,
  onDelete: () -> Unit,
  onShare: () -> Unit,
) {
  val baseline = if (props.darkTheme) darkColorScheme() else lightColorScheme()
  val colors = baseline.copy(
    primary = rgbaHexToColor(props.primaryColor, baseline.primary),
    onPrimary = rgbaHexToColor(props.onPrimaryColor, baseline.onPrimary),
    surface = rgbaHexToColor(props.surfaceColor, baseline.surface),
    surfaceContainerLow = rgbaHexToColor(
      props.surfaceContainerLowColor,
      baseline.surfaceContainerLow,
    ),
    onSurface = rgbaHexToColor(props.onSurfaceColor, baseline.onSurface),
    onSurfaceVariant = rgbaHexToColor(
      props.onSurfaceVariantColor,
      baseline.onSurfaceVariant,
    ),
    surfaceTint = rgbaHexToColor(props.surfaceTintColor, baseline.surfaceTint),
    error = rgbaHexToColor(props.errorColor, baseline.error),
    onError = rgbaHexToColor(props.onErrorColor, baseline.onError),
    secondaryContainer = rgbaHexToColor(
      props.secondaryContainerColor,
      baseline.secondaryContainer,
    ),
    onSecondaryContainer = rgbaHexToColor(
      props.onSecondaryContainerColor,
      baseline.onSecondaryContainer,
    ),
  )

  MaterialTheme(colorScheme = colors) {
    val actionWidth = 104.dp
    val actionWidthPx = with(LocalDensity.current) { actionWidth.toPx() }
    val state = remember(props.cacheKey) { AnchoredDraggableState(SwipeAnchor.Closed) }
    val scope = rememberCoroutineScope()
    val shape = RoundedCornerShape(22.dp)

    LaunchedEffect(actionWidthPx, state.settledValue) {
      val anchors = DraggableAnchors {
        when (state.settledValue) {
          SwipeAnchor.Closed -> {
            SwipeAnchor.Delete at actionWidthPx
            SwipeAnchor.Closed at 0f
            SwipeAnchor.Share at -actionWidthPx
          }
          SwipeAnchor.Delete -> {
            SwipeAnchor.Delete at actionWidthPx
            SwipeAnchor.Closed at 0f
          }
          SwipeAnchor.Share -> {
            SwipeAnchor.Closed at 0f
            SwipeAnchor.Share at -actionWidthPx
          }
        }
      }
      state.updateAnchors(anchors, state.settledValue)
    }

    fun closeThen(action: () -> Unit) {
      scope.launch {
        state.animateTo(SwipeAnchor.Closed)
        action()
      }
    }

    Box(
      modifier = Modifier
        .fillMaxSize()
        .clip(shape),
    ) {
      SwipeAction(
        label = "删除",
        icon = R.drawable.sensoraya_delete,
        background = colors.error,
        foreground = colors.onError,
        modifier = Modifier
          .align(Alignment.CenterStart)
          .width(actionWidth + 24.dp)
          .fillMaxHeight()
          .graphicsLayer {
            val currentOffset = state.offset.takeUnless(Float::isNaN) ?: 0f
            alpha = (currentOffset / actionWidthPx).coerceIn(0f, 1f)
          },
        contentPadding = Modifier.padding(end = 24.dp),
        onClick = { closeThen(onDelete) },
      )
      SwipeAction(
        label = "分享",
        icon = R.drawable.sensoraya_share,
        background = colors.secondaryContainer,
        foreground = colors.onSecondaryContainer,
        modifier = Modifier
          .align(Alignment.CenterEnd)
          .width(actionWidth + 24.dp)
          .fillMaxHeight()
          .graphicsLayer {
            val currentOffset = state.offset.takeUnless(Float::isNaN) ?: 0f
            alpha = (-currentOffset / actionWidthPx).coerceIn(0f, 1f)
          },
        contentPadding = Modifier.padding(start = 24.dp),
        onClick = { closeThen(onShare) },
      )

      Surface(
        onClick = {
          if (state.settledValue == SwipeAnchor.Closed) {
            onOpen()
          } else {
            scope.launch { state.animateTo(SwipeAnchor.Closed) }
          }
        },
        modifier = Modifier
          .fillMaxSize()
          .graphicsLayer {
            translationX = state.offset.takeUnless(Float::isNaN) ?: 0f
          }
          .anchoredDraggable(state, Orientation.Horizontal)
          .semantics { contentDescription = "查看${props.label}" },
        shape = shape,
        color = colors.surfaceContainerLow,
        tonalElevation = 1.dp,
      ) {
        Column(
          modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp, vertical = 14.dp),
          verticalArrangement = Arrangement.spacedBy(5.dp, Alignment.CenterVertically),
        ) {
          Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
          ) {
            Text(
              text = props.label,
              style = MaterialTheme.typography.titleMedium,
              color = colors.onSurface,
            )
            Spacer(modifier = Modifier.weight(1f))
            Text(
              text = "查看  ›",
              style = MaterialTheme.typography.labelMedium,
              color = colors.primary,
            )
          }
          Text(
            text = props.dateRange,
            style = MaterialTheme.typography.bodyMedium,
            color = colors.onSurface,
            maxLines = 1,
          )
          Text(
            text = props.metadata,
            style = MaterialTheme.typography.bodySmall,
            color = colors.onSurfaceVariant,
            maxLines = 1,
          )
        }
      }
    }
  }
}

@Composable
private fun SwipeAction(
  label: String,
  icon: Int,
  background: Color,
  foreground: Color,
  modifier: Modifier,
  contentPadding: Modifier,
  onClick: () -> Unit,
) {
  Surface(
    onClick = onClick,
    modifier = modifier,
    color = background,
    contentColor = foreground,
  ) {
    Column(
      modifier = contentPadding.fillMaxSize(),
      horizontalAlignment = Alignment.CenterHorizontally,
      verticalArrangement = Arrangement.spacedBy(4.dp, Alignment.CenterVertically),
    ) {
      Icon(
        painter = painterResource(icon),
        contentDescription = label,
        modifier = Modifier.size(24.dp),
        tint = foreground,
      )
      Text(
        text = label,
        style = MaterialTheme.typography.labelLarge,
        color = foreground,
      )
    }
  }
}

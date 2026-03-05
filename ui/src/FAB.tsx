import React, { useRef, useState, useEffect } from "react";
import type {
  GestureResponderEvent,
  ImageStyle,
  TouchableOpacityProps,
  ViewStyle
} from "react-native";
import { Dimensions, Image, StyleSheet, TouchableOpacity, View } from "react-native";
import {
  PanGestureHandler,
  State,
  type PanGestureHandlerGestureEvent,
  type PanGestureHandlerStateChangeEvent
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from "react-native-reanimated";

type DragEvent = PanGestureHandlerGestureEvent["nativeEvent"];

export interface FABProps extends TouchableOpacityProps {
  renderSize: number;
  draggable?: boolean;
  reversible?: boolean;
  icon?: number;
  iconSize?: number;
  iconStyle?: ImageStyle;
  tintColor?: string;
  borderRadius?: number;
  backgroundColor?: string;
  topOffset?: number;
  rightOffset?: number;
  bottomOffset?: number;
  leftOffset?: number;
  idleOpacity?: number;
  idleDelayTime?: number;
  children?: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  onDragStart?: (event: DragEvent) => void;
  onDragEnd?: (event: DragEvent) => void;
}

const { width, height } = Dimensions.get("window");



let timer: ReturnType<typeof setTimeout> | null = null;

useEffect(() => {
  return () => {
    if (timer) {
      clearTimeout(timer);
    }
  };
}, []);

export const FAB: React.FC<FABProps> = ({
  renderSize,
  draggable = true,
  reversible = false,
  icon,
  iconSize = 24,
  iconStyle,
  tintColor,
  borderRadius,
  backgroundColor,
  topOffset = 60,
  rightOffset = 16,
  bottomOffset = 60,
  leftOffset = 16,
  idleOpacity = 0.5,
  idleDelayTime = 3000,
  children,
  onPress,
  onLongPress,
  onDragStart,
  onDragEnd,
  ...touchableProps
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const [opacity, setOpacity] = useState<number>(idleOpacity);
  const HORIZONTAL_BOUNDS = width - renderSize - (leftOffset + rightOffset);
  const VERTICAL_BOUNDS = height - renderSize - (bottomOffset + topOffset);
  const MIN_Y = -VERTICAL_BOUNDS;
  const MAX_Y = 0;
  const startXRef = useRef(0);
  const startYRef = useRef(0);

  const wrapperStyle: (ViewStyle | any)[] = [
    { position: "absolute" },
    { bottom: bottomOffset },
    { right: rightOffset }
  ];

  const containerStyle: (ViewStyle | any)[] = [
    baseStyles.defaultStyle,
    { width: renderSize, height: renderSize },
    { opacity },
    borderRadius && { borderRadius },
    backgroundColor && { backgroundColor }
  ];

  const defaultIconStyle: ImageStyle = {
    height: iconSize,
    width: iconSize,
    tintColor,
    ...iconStyle
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value }
    ]
  }));

  const handleGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    if (!draggable) return;
    const { translationX, translationY } = event.nativeEvent;
    const nextX = startXRef.current + translationX;
    let nextY = startYRef.current + translationY;

    if (nextY < MIN_Y) nextY = MIN_Y;
    if (nextY > MAX_Y) nextY = MAX_Y;

    translateX.value = nextX;
    translateY.value = nextY;
  };

  const handleStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    const { state } = event.nativeEvent;

    if (state === State.BEGAN) {
      startXRef.current = translateX.value;
      startYRef.current = translateY.value;
      if (timer) {
        clearTimeout(timer);
      }
      setOpacity(1);
      if (onDragStart) {
        onDragStart(event.nativeEvent);
      }
      return;
    }

    if (
      state === State.END ||
      state === State.CANCELLED ||
      state === State.FAILED
    ) {
      if (reversible) {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      } else {
        let newX = 0;
        const xValue = translateX.value;
        const centerHorizontal = (width - renderSize) / 2;
        if (xValue > 0) {
          newX = Math.abs(xValue) > centerHorizontal ? HORIZONTAL_BOUNDS : 0;
        } else {
          newX = Math.abs(xValue) > centerHorizontal ? -HORIZONTAL_BOUNDS : 0;
        }
        translateX.value = withSpring(newX);
      }

      if (onDragEnd) {
        onDragEnd(event.nativeEvent as DragEvent);
      }

      timer = setTimeout(() => {
        setOpacity(idleOpacity);
      }, idleDelayTime);
    }
  };

  return (
    <View style={wrapperStyle}>
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        {...touchableProps}
      >
        <PanGestureHandler
          onGestureEvent={handleGestureEvent}
          onHandlerStateChange={handleStateChange}
        >
          <Animated.View style={[containerStyle, animatedStyle]}>
            <View>
              {children ? (
                children
              ) : icon ? (
                <Image
                  source={icon}
                  style={defaultIconStyle}
                  resizeMode="contain"
                />
              ) : null}
            </View>
          </Animated.View>
        </PanGestureHandler>
      </TouchableOpacity>
    </View>
  );
};

const baseStyles = StyleSheet.create({
  defaultStyle: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000"
  }
});
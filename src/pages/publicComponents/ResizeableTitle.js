import {Resizable} from "react-resizable";
import React from "react";

const ResizeableTitle = props => {
  const {onResize, width, ...restProps} = props;

  if (!width) {
    return <th {...restProps} />;
  }

  return (
    <Resizable
      width={width}
      height={0}
      onResize={onResize}
      draggableOpts={{enableUserSelectHack: false}}
    >
      <th {...restProps} />
    </Resizable>
  );
};

export default ResizeableTitle;

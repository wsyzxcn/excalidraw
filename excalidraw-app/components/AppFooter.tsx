import { Footer } from "@excalidraw/excalidraw/index";
import React from "react";

import { isExcalidrawPlusSignedUser } from "../app_constants";

import { DebugFooter, isVisualDebuggerEnabled } from "./DebugCanvas";
import { EncryptedIcon } from "./EncryptedIcon";

export const AppFooter = React.memo(
  ({
    onChange,
    remoteProjectName,
    remoteFileName,
    remoteSaveStatus,
  }: {
    onChange: () => void;
    remoteProjectName?: string | null;
    remoteFileName?: string | null;
    remoteSaveStatus?: string | null;
  }) => {
    return (
      <Footer>
        <div
          style={{
            display: "flex",
            gap: ".5rem",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {remoteProjectName && remoteFileName ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: ".35rem",
                padding: "0.25rem 0.5rem",
                borderRadius: "999px",
                background: "var(--island-bg-color)",
                color: "var(--text-primary-color)",
                fontSize: ".875rem",
                lineHeight: 1.2,
              }}
            >
              <strong>Project</strong>
              <span>{remoteProjectName}</span>
              <span style={{ opacity: 0.5 }}>/</span>
              <strong>File</strong>
              <span>{remoteFileName}</span>
              {remoteSaveStatus ? (
                <>
                  <span style={{ opacity: 0.5 }}>/</span>
                  <span>{remoteSaveStatus}</span>
                </>
              ) : null}
            </div>
          ) : null}
          {isVisualDebuggerEnabled() && <DebugFooter onChange={onChange} />}
          {!isExcalidrawPlusSignedUser && <EncryptedIcon />}
        </div>
      </Footer>
    );
  },
);

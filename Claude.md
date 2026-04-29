# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

鯨唄（くじらうた）の自習用練習Webアプリ。先生のMP3音源をbase64でHTMLに埋め込み、ブラウザ単体でオフライン動作する。カラオケ採点風に音程・節回しを比較する。

- **形式**: 単一HTMLファイル（フレームワーク・依存ライブラリなし）
- **最新版**: `鯨唄練習アプリv9.html`（v7は参考用の旧バージョン）
- **動作環境**: PC・スマホのブラウザ（Safari / Chrome）。スマホはGoogle Drive経由でHTMLを転送して使用

## 開発方法

ビルド・コンパイル・サーバー起動は不要。HTMLファイルをブラウザで直接開くだけで動作する。

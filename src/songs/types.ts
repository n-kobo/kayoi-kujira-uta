/** 歌詞1行分。sec は曲頭からの表示開始秒。 */
export interface LyricLine {
  sec: number;
  text: string;
}

/**
 * 1曲分の定義。曲を追加するときは src/songs/<曲id>/ を作り、
 * この型を満たすオブジェクトを export して src/songs/index.ts に登録する。
 */
export interface Song {
  /** レジストリ内で一意なID（例: 'iwai-medeta'） */
  id: string;
  /** 画面に表示する曲名（例: '祝いめでた'） */
  title: string;
  /** お手本の出典表記（例: '通鯨唄保存会'） */
  credit: string;
  /** MP3音源のbase64文字列（?raw インポート） */
  audioBase64: string;
  /** 歌詞（秒指定）。空配列でも動作する */
  lyrics: LyricLine[];
  /** この秒数で再生・録音を打ち切る。未指定なら音源の最後まで */
  endSec?: number;
  /** 採点「継続・伸び」の満点基準秒（既定30秒） */
  scoringDurationSec?: number;
}

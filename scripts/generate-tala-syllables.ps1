$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$output = Join-Path $PSScriptRoot '..\public\audio\tala'
[System.IO.Directory]::CreateDirectory($output) | Out-Null
$voice = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
  $voice.SelectVoice('Microsoft Zira Desktop')
  $voice.Rate = 3
  $pronunciations = @{ ta = 'tah'; ka = 'kah'; di = 'dee'; mi = 'mee'; ki = 'kee' }
  foreach ($syllable in @('ta', 'ka', 'di', 'mi', 'ki')) {
    $stream = New-Object System.IO.MemoryStream
    try {
      $format = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(22050, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)
      $voice.SetOutputToAudioStream($stream, $format)
      $voice.Speak($pronunciations[$syllable])
      $voice.SetOutputToNull()
      $bytes = $stream.ToArray()
      $dataOffset = 0
      $dataLength = $bytes.Length
      $first = -1
      $last = 0
      $peak = 0
      for ($i = 0; $i -lt $dataLength; $i += 2) {
        $value = [Math]::Abs([int][BitConverter]::ToInt16($bytes, $dataOffset + $i))
        $peak = [Math]::Max($peak, $value)
        if ($value -gt 250) {
          if ($first -lt 0) { $first = $i }
          $last = $i
        }
      }
      if ($first -lt 0) { throw "Silent sample for $syllable" }
      $first = [Math]::Max(0, $first - 220)
      $last = [Math]::Min($dataLength - 2, $last + 440)
      $pcmLength = $last - $first + 2
      $file = [System.IO.File]::Create((Join-Path $output "$syllable.wav"))
      $writer = New-Object System.IO.BinaryWriter($file)
      try {
        $writer.Write([Text.Encoding]::ASCII.GetBytes('RIFF'))
        $writer.Write([int](36 + $pcmLength))
        $writer.Write([Text.Encoding]::ASCII.GetBytes('WAVEfmt '))
        $writer.Write([int]16); $writer.Write([int16]1); $writer.Write([int16]1)
        $writer.Write([int]22050); $writer.Write([int]44100)
        $writer.Write([int16]2); $writer.Write([int16]16)
        $writer.Write([Text.Encoding]::ASCII.GetBytes('data')); $writer.Write([int]$pcmLength)
        for ($i = $first; $i -le $last; $i += 2) {
          $value = [BitConverter]::ToInt16($bytes, $dataOffset + $i)
          $writer.Write([int16]($value * 24000 / $peak))
        }
      } finally { $writer.Dispose(); $file.Dispose() }
    } finally { $stream.Dispose() }
  }
} finally { $voice.Dispose() }

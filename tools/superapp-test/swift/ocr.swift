// usage: swiftc -O ocr.swift -o ocr && ./ocr <screenshot.png>
// Prints one row per recognised line: text<TAB>centerX<TAB>centerY<TAB>width<TAB>height
// in image pixels, origin top-left (for an adb screencap that is device pixels). macOS Vision, Thai + English.
import Vision
import AppKit
let path = CommandLine.arguments[1]
guard let img = NSImage(contentsOfFile: path), let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { exit(1) }
let W = Double(cg.width), H = Double(cg.height)
let req = VNRecognizeTextRequest()
req.recognitionLevel = .accurate
req.recognitionLanguages = ["th-TH", "en-US"]
req.usesLanguageCorrection = false
try VNImageRequestHandler(cgImage: cg, options: [:]).perform([req])
for o in (req.results ?? []) {
  guard let c = o.topCandidates(1).first else { continue }
  let b = o.boundingBox
  print("\(c.string)\t\(Int(b.midX * W))\t\(Int((1 - b.midY) * H))\t\(Int(b.width * W))\t\(Int(b.height * H))")
}

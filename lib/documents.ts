import { PDFDocument,StandardFonts,rgb } from "pdf-lib";
import QRCode from "qrcode";
import { assert } from "./db";
export async function makeDocument(title:string,lines:string[],demo:boolean,verifyUrl?:string){
  const pdf=await PDFDocument.create();
  const page=pdf.addPage([595,842]);
  const regular=await pdf.embedFont(StandardFonts.Helvetica);
  const bold=await pdf.embedFont(StandardFonts.HelveticaBold);
  const clean=(s:string)=>{
    const normalized=s.replace(/[–—]/g,"-").replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/\s/g," ");
    assert(/^[\x20-\x7E]*$/.test(normalized),"This document needs an updated language template. Contact college administration; your original record has been preserved.");
    return normalized;
  };
  page.drawRectangle({x:0,y:725,width:595,height:117,color:rgb(.08,.23,.19)});
  page.drawText("AKIMS",{x:45,y:790,size:28,font:bold,color:rgb(1,1,1)});
  page.drawText("Akbar Institute of Medical Sciences",{x:45,y:765,size:12,font:regular,color:rgb(.8,.9,.85)});
  page.drawText(clean(title),{x:45,y:682,size:23,font:bold,color:rgb(.1,.2,.17)});
  let y=645;
  if(demo){
    page.drawText("DEMONSTRATION - NOT VALID FOR PAYMENT OR OFFICIAL USE",{x:45,y,size:10,font:bold,color:rgb(.7,.25,.08)});y-=36;
  }
  for(const line of lines){
    const words=clean(line).split(" ");let row="";
    for(const word of words){
      if(regular.widthOfTextAtSize(row+" "+word,11)>495){page.drawText(row,{x:45,y,size:11,font:regular});y-=18;row=word;}
      else row+=(row?" ":"")+word;
    }
    page.drawText(row,{x:45,y,size:11,font:regular});y-=28;
  }
  if(verifyUrl){
    const img=await pdf.embedPng(await QRCode.toBuffer(verifyUrl));
    page.drawImage(img,{x:445,y:92,width:95,height:95});
    page.drawText("Scan to verify current status",{x:365,y:75,size:10,font:regular});
  }
  page.drawLine({start:{x:45,y:65},end:{x:550,y:65},color:rgb(.8,.84,.81),thickness:1});
  page.drawText("AKIMS Campus  |  Electronic record  |  No handwritten signature is reproduced",{x:45,y:45,size:9,font:regular,color:rgb(.4,.45,.42)});
  return pdf.save();
}

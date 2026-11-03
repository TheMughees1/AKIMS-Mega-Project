export function parseCSV(text:string):string[][]{
  const rows:string[][]=[];let row:string[]=[];let field="";let quoted=false;
  text=text.replace(/^\uFEFF/,"");
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(c==='"'){
      if(quoted&&text[i+1]==='"'){field+='"';i++;}
      else if(quoted)quoted=false;
      else if(field.length===0)quoted=true;
      else throw new Error("Unexpected quote. Export a standard UTF-8 CSV and try again.");
    }else if(!quoted&&(c===","||c==="\n"||c==="\r")){
      row.push(field.trim());field="";
      if(c!==","){
        if(row.some(v=>v!==""))rows.push(row);
        row=[];
        if(c==="\r"&&text[i+1]==="\n")i++;
      }
    }else field+=c;
    if(rows.length>1001)throw new Error("Import up to 1,000 students per batch.");
    if(row.length>40||field.length>1000)throw new Error("A column or field is too large for this import.");
  }
  if(quoted)throw new Error("An unclosed quoted field was found.");
  row.push(field.trim());if(row.some(v=>v!==""))rows.push(row);
  if(rows.length<2)throw new Error("Include a header and at least one student row.");
  if(rows[0].length>40)throw new Error("Import at most 40 source columns.");
  if(rows.some(r=>r.length!==rows[0].length))throw new Error("Rows have different column counts. Review the source file.");
  return rows;
}
export function csvCell(value:unknown){
  let s=String(value??"");
  if(/^[=+\-@\t\r]/.test(s))s="'"+s;
  return '"'+s.replace(/"/g,'""')+'"';
}

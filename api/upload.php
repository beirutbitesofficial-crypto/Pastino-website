<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
require_admin();
if($_SERVER['REQUEST_METHOD']!=='POST')json_response(['error'=>'Method not allowed.'],405);
try{
    if(!isset($_FILES['file'])||$_FILES['file']['error']!==UPLOAD_ERR_OK)json_response(['error'=>'Choose an image to upload.'],400);
    $file=$_FILES['file']; if($file['size']>8*1024*1024)json_response(['error'=>'Image must be smaller than 8 MB.'],400);
    $finfo=new finfo(FILEINFO_MIME_TYPE); $mime=$finfo->file($file['tmp_name']); $allowed=['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp']; if(!isset($allowed[$mime]))json_response(['error'=>'Only JPG, PNG and WebP images are allowed.'],400);
    $dir=__DIR__.'/../uploads'; if(!is_dir($dir)&&!mkdir($dir,0775,true))throw new RuntimeException('Could not create uploads folder.');
    $name=date('YmdHis').'-'.bin2hex(random_bytes(6)).'.'.$allowed[$mime]; $target=$dir.'/'.$name; if(!move_uploaded_file($file['tmp_name'],$target))throw new RuntimeException('Could not save uploaded image.');
    json_response(['ok'=>true,'url'=>'/uploads/'.$name]);
}catch(Throwable $e){json_response(['error'=>$e->getMessage()],500);}

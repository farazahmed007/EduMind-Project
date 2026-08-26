from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel


router = APIRouter(
    prefix="/api/materials",
    tags=["Materials"],
)


materials = [
    {
        "id": 1,
        "title": "Machine Learning Fundamentals",
        "type": "PDF",
        "size": "2.4 MB",
        "time": "2 hours ago",
    },
    {
        "id": 2,
        "title": "Computer Networks",
        "type": "PPT",
        "size": "4.2 MB",
        "time": "Yesterday",
    },
    {
        "id": 3,
        "title": "Java OOP Concepts",
        "type": "PDF",
        "size": "1.8 MB",
        "time": "Yesterday",
    },
]


# =========================
# Rename Request Schema
# =========================

class MaterialUpdate(BaseModel):
    title: str


# =========================
# GET ALL MATERIALS
# =========================

@router.get("/")
def get_materials():
    return materials


# =========================
# CREATE / UPLOAD MATERIAL
# =========================

@router.post("/")
async def create_material(file: UploadFile = File(...)):

    content = await file.read()

    extension = file.filename.split(".")[-1].upper()

    if extension == "PPTX":
        material_type = "PPT"
    elif extension == "DOCX":
        material_type = "DOC"
    else:
        material_type = extension

    new_material = {
        "id": max(
            [material["id"] for material in materials],
            default=0
        ) + 1,

        "title": file.filename,

        "type": material_type,

        "size": f"{len(content) / (1024 * 1024):.2f} MB",

        "time": "Just now",
    }

    materials.insert(0, new_material)

    return new_material


# =========================
# DELETE MATERIAL
# =========================

@router.delete("/{material_id}")
def delete_material(material_id: int):

    for material in materials:

        if material["id"] == material_id:

            materials.remove(material)

            return {
                "message": "Material deleted successfully",
                "id": material_id,
            }

    raise HTTPException(
        status_code=404,
        detail="Material not found",
    )


# =========================
# RENAME / UPDATE MATERIAL
# =========================

@router.patch("/{material_id}")
def update_material(
    material_id: int,
    material_update: MaterialUpdate,
):

    new_title = material_update.title.strip()

    if not new_title:
        raise HTTPException(
            status_code=400,
            detail="Title cannot be empty",
        )

    for material in materials:

        if material["id"] == material_id:

            material["title"] = new_title

            return material

    raise HTTPException(
        status_code=404,
        detail="Material not found",
    )
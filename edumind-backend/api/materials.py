from fastapi import APIRouter, UploadFile, File, HTTPException

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


@router.get("/")
def get_materials():
    return materials


@router.post("/")
async def create_material(file: UploadFile = File(...)):

    # Check that a file was actually provided
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file provided"
        )

    # Get file extension
    extension = file.filename.split(".")[-1].upper()

    # Convert PPTX to PPT for frontend consistency
    material_type = "PPT" if extension == "PPTX" else extension

    # Read file to calculate size
    file_content = await file.read()
    file_size_mb = len(file_content) / (1024 * 1024)

    # Generate a new ID
    new_id = max(
        [material["id"] for material in materials],
        default=0
    ) + 1

    # Create material record
    new_material = {
        "id": new_id,
        "title": file.filename,
        "type": material_type,
        "size": f"{file_size_mb:.2f} MB",
        "time": "Just now",
    }

    # Add material to our temporary storage
    materials.insert(0, new_material)

    return new_material
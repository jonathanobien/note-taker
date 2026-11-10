import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonModal,
  IonPage,
  IonTextarea,
  IonThumbnail,
  IonTitle,
  IonToolbar,
  useIonToast,
} from '@ionic/react';
import { add, cameraOutline, documentTextOutline, trashOutline } from 'ionicons/icons';
import { useEffect, useMemo, useState } from 'react';

import { loadNotes, newId, Note, saveNotes } from '../data/notes';
import './Home.css';

const Home: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [editing, setEditing] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [image, setImage] = useState<string | undefined>(undefined);
  const [modalFlag, setModalFlag] = useState(false);
  const [presentToast] = useIonToast();

  useEffect(() => {
    setNotes(loadNotes());
  }, []);

  const persist = (next: Note[]) => {
    const sorted = [...next].sort((a, b) => b.updatedAt - a.updatedAt);
    setNotes(sorted);
    try {
      saveNotes(sorted);
    } catch {
      presentToast({
        message: 'Could not save — storage may be full (photos take space).',
        duration: 2500,
        color: 'danger',
      });
    }
  };

  const openNew = () => {
    setEditing(null);
    setTitle('');
    setBody('');
    setImage(undefined);
    setModalFlag(true);
  };

  const openExisting = (note: Note) => {
    setEditing(note);
    setTitle(note.title);
    setBody(note.body);
    setImage(note.image);
    setModalFlag(true);
  };

  const dismiss = () => {
    setModalFlag(false);
    setEditing(null);
    setTitle('');
    setBody('');
    setImage(undefined);
  };

  const takePhoto = async () => {
    try {
      const photo = await Camera.getPhoto({
        quality: 55,
        width: 1200,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
        promptLabelHeader: 'Add a photo',
        promptLabelPhoto: 'Choose from gallery',
        promptLabelPicture: 'Take a picture',
      });
      setImage(photo.dataUrl);
    } catch {
      // User cancelled the camera / picker — nothing to do.
    }
  };

  const commit = () => {
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    if (!trimmedTitle && !trimmedBody && !image) {
      dismiss();
      return;
    }
    if (editing && editing.id) {
      persist(
        notes.map((n) =>
          n.id === editing.id
            ? { ...n, title: trimmedTitle, body: trimmedBody, image, updatedAt: Date.now() }
            : n,
        ),
      );
    } else {
      persist([
        { id: newId(), title: trimmedTitle, body: trimmedBody, image, updatedAt: Date.now() },
        ...notes,
      ]);
    }
    setModalFlag(false);
    setEditing(null);
    setTitle('');
    setBody('');
    setImage(undefined);
  };

  const remove = (id: string) => persist(notes.filter((n) => n.id !== id));

  const formatted = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [],
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Note Taker</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Note Taker</IonTitle>
          </IonToolbar>
        </IonHeader>

        {notes.length === 0 ? (
          <div className="empty-state">
            <IonIcon icon={documentTextOutline} />
            <h2>No notes yet</h2>
            <p>Tap the + button to create your first note.</p>
          </div>
        ) : (
          <IonList>
            {notes.map((note) => (
              <IonItemSliding key={note.id}>
                <IonItem button onClick={() => openExisting(note)}>
                  {note.image && (
                    <IonThumbnail slot="start">
                      <img src={note.image} alt="" />
                    </IonThumbnail>
                  )}
                  <IonLabel>
                    <h2>{note.title || 'Untitled'}</h2>
                    <p className="note-preview">{note.body || (note.image ? '📷 Photo note' : 'No content')}</p>
                    <p className="note-date">{formatted.format(note.updatedAt)}</p>
                  </IonLabel>
                </IonItem>
                <IonItemOptions side="end">
                  <IonItemOption color="danger" onClick={() => remove(note.id)}>
                    <IonIcon slot="icon-only" icon={trashOutline} />
                  </IonItemOption>
                </IonItemOptions>
              </IonItemSliding>
            ))}
          </IonList>
        )}

        <IonFab slot="fixed" vertical="bottom" horizontal="end">
          <IonFabButton onClick={openNew} aria-label="Add note">
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <IonModal isOpen={modalFlag} onDidDismiss={dismiss}>
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton onClick={dismiss}>Cancel</IonButton>
              </IonButtons>
              <IonTitle>{editing ? 'Edit Note' : 'New Note'}</IonTitle>
              <IonButtons slot="end">
                <IonButton strong onClick={commit}>
                  Save
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonInput
              label="Title"
              labelPlacement="floating"
              value={title}
              onIonInput={(e) => setTitle(e.detail.value ?? '')}
              placeholder="Note title"
            />
            <IonTextarea
              label="Note"
              labelPlacement="floating"
              value={body}
              onIonInput={(e) => setBody(e.detail.value ?? '')}
              autoGrow
              rows={8}
              placeholder="Write your note here..."
            />

            {image && (
              <div className="photo-preview">
                <img src={image} alt="Note attachment" />
              </div>
            )}

            <IonButton expand="block" fill="outline" className="photo-btn" onClick={takePhoto}>
              <IonIcon slot="start" icon={cameraOutline} />
              {image ? 'Replace Photo' : 'Add Photo'}
            </IonButton>
            {image && (
              <IonButton
                expand="block"
                fill="clear"
                color="danger"
                onClick={() => setImage(undefined)}
              >
                Remove Photo
              </IonButton>
            )}
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Home;
